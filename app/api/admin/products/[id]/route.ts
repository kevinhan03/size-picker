import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../../server/auth/admin-session.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { normalizeBrandName, refreshBrandRulesCache } from "../../../../../server/utils/brand-rules.js";
import { removeOldProductImageIfUnused, toProductWriteErrorResponse } from "../../../../../server/utils/product.js";
import { parseSizeTable } from "../../../../../server/utils/size-table.js";

const adminUnauthorized = () =>
  NextResponse.json(
    { ok: false, error: "admin authentication required" },
    { status: 401 }
  );

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  if (!verifyAdminSessionToken(token)) return adminUnauthorized();

  const { id } = await context.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "product id is required" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const payload: Record<string, unknown> = {};
  const requestedUrl = "url" in body ? String(body?.url || "").trim() : "";
  await refreshBrandRulesCache();
  if ("brand" in body) {
    payload.brand = normalizeBrandName(String(body?.brand || "").trim(), {
      url: requestedUrl,
    });
  }
  if ("name" in body) payload.name = String(body?.name || "").trim();
  if ("category" in body) {
    const category = String(body?.category || "").trim();
    payload.category = category || null;
  }
  if ("url" in body) {
    const url = String(body?.url || "").trim();
    payload.url = url || null;
  }
  if ("imagePath" in body) {
    const imagePath = String(body?.imagePath || "").trim();
    payload.image_path = imagePath || null;
  }
  if ("sizeTable" in body) payload.size_table = parseSizeTable(body?.sizeTable ?? null);
  if ("isInstagram" in body) payload.is_instagram = Boolean(body.isInstagram);

  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length === 0) {
    return NextResponse.json(
      { ok: false, error: "at least one updatable field is required" },
      { status: 400 }
    );
  }
  if ("brand" in payload && !payload.brand) {
    return NextResponse.json({ ok: false, error: "brand cannot be empty" }, { status: 400 });
  }
  if ("name" in payload && !payload.name) {
    return NextResponse.json({ ok: false, error: "name cannot be empty" }, { status: 400 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const hasImagePathInPayload = Object.prototype.hasOwnProperty.call(payload, "image_path");
    let previousImagePath: string | null = null;

    if (hasImagePathInPayload) {
      const { data: existingProduct, error: existingProductError } = await db
        .from(SUPABASE_PRODUCTS_TABLE)
        .select("id,image_path")
        .eq("id", productId)
        .maybeSingle();

      if (existingProductError) throw existingProductError;
      if (!existingProduct) {
        return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
      }

      previousImagePath = String(existingProduct.image_path || "").trim() || null;
    }

    const { data, error } = await db
      .from(SUPABASE_PRODUCTS_TABLE)
      .update(payload)
      .eq("id", productId)
      .select("id,brand,name,category,url,size_table,created_at,image_path")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    const currentImagePath = String(data.image_path || "").trim() || null;
    if (hasImagePathInPayload && previousImagePath && previousImagePath !== currentImagePath) {
      await removeOldProductImageIfUnused({
        oldPath: previousImagePath,
        updatedProductId: String(data.id || productId),
      });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({
      ok: true,
      data: { product: data },
    });
  } catch (error: unknown) {
    const { statusCode, message } = toProductWriteErrorResponse(error, "product update error");
    return NextResponse.json({ ok: false, error: message }, { status: statusCode });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  if (!verifyAdminSessionToken(token)) return adminUnauthorized();

  const { id } = await context.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "product id is required" },
      { status: 400 }
    );
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data, error } = await db
      .from(SUPABASE_PRODUCTS_TABLE)
      .delete()
      .eq("id", productId)
      .select("id,image_path");

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    const deletedProduct = data[0];
    await removeOldProductImageIfUnused({
      oldPath: deletedProduct?.image_path,
      updatedProductId: productId,
    });

    revalidatePath("/", "layout");
    return NextResponse.json({
      ok: true,
      data: { id: productId },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "product delete error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}
