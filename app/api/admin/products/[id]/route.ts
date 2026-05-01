import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { verifyAdminRequest } from "../../../../../server/utils/admin-request.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { normalizeBrandName, refreshBrandRulesCache } from "../../../../../server/utils/brand-rules.js";
import { removeOldProductImageIfUnused, toProductWriteErrorResponse } from "../../../../../server/utils/product.js";
import { normalizeSizeTableForCategory, parseSizeTable } from "../../../../../server/utils/size-table.js";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const { id } = await context.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "product id is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const payload: Record<string, unknown> = {};
    await refreshBrandRulesCache();
    if ("brand" in body) {
      payload.brand = normalizeBrandName(String(body?.brand || "").trim());
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
    const nextCategory = "category" in body ? String(body?.category || "").trim() : "";
    if ("sizeTable" in body) {
      const sizeTable = parseSizeTable(body?.sizeTable ?? null);
      payload.size_table = sizeTable;
      const categoryForNormalization = nextCategory || String(body?.currentCategory || "").trim();
      payload.normalized_size_table = normalizeSizeTableForCategory(categoryForNormalization, sizeTable);
    }
    if ("isInstagram" in body) {
      payload.is_instagram = Boolean(body.isInstagram);
      if (!payload.is_instagram) payload.instagram_order = null;
    }
    if ("instagramOrder" in body) {
      const order = Number(body?.instagramOrder);
      payload.instagram_order = Number.isFinite(order) ? order : null;
    }

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

    assertSupabaseConfig();
    const db = supabase!;
    const hasImagePathInPayload = Object.prototype.hasOwnProperty.call(payload, "image_path");
    let previousImagePath: string | null = null;

    if (payload.is_instagram === true && !Object.prototype.hasOwnProperty.call(payload, "instagram_order")) {
      const { data: lastFeaturedProduct } = await db
        .from(SUPABASE_PRODUCTS_TABLE)
        .select("instagram_order")
        .eq("is_instagram", true)
        .not("instagram_order", "is", null)
        .order("instagram_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastOrder = Number(lastFeaturedProduct?.instagram_order || 0);
      payload.instagram_order = Number.isFinite(lastOrder) ? lastOrder + 1 : 1;
    }

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
      .select("id,brand,name,category,url,size_table,normalized_size_table,created_at,image_path,is_instagram,instagram_order")
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
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

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
