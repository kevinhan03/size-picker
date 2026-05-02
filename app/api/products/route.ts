import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { normalizeBrandName, refreshBrandRulesCache } from "../../../server/utils/brand-rules.js";
import {
  fetchProductsRows,
  generateProductSlug,
  insertProductRow,
  normalizeProductRow,
  toProductWriteErrorResponse,
} from "../../../server/utils/product.js";
import { normalizeSizeTableForCategory, parseSizeTable } from "../../../server/utils/size-table.js";
import { verifyRegisteredBearerToken } from "../../../server/utils/verify-auth.js";
import { assertSupabaseConfig } from "../../../server/lib/supabase.js";

interface RegisteredUser {
  id: string;
  email?: string;
  appUsername: string;
}

const VALID_CATEGORIES = new Set([
  "Outer", "Top", "Bottom", "Shoes", "Acc", "단종된 상품(빈티지)",
]);

export async function GET() {
  try {
    await refreshBrandRulesCache();
    const rows = await fetchProductsRows();
    const products = rows
      .map((row: unknown) => normalizeProductRow(row))
      .filter((product: unknown) => product !== null);

    return NextResponse.json({
      ok: true,
      data: { products },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "products fetch error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = String(request.headers.get("authorization") || "").trim();
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });
    }
    const user = await verifyRegisteredBearerToken(token) as RegisteredUser | null;
    if (!user) {
      return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    }

    assertSupabaseConfig();
    const registeredBy = String(user.appUsername || "").trim() || null;

    const body = await request.json();
    const url = String(body?.url || "#").trim();
    await refreshBrandRulesCache();
    const brand = normalizeBrandName(String(body?.brand || "").trim());
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "").trim();
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { ok: false, error: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
        { status: 400 }
      );
    }
    const imagePath = String(body?.image_path ?? body?.imagePath ?? "").trim();
    const image = String(body?.image || "").trim();
    const sizeTable = parseSizeTable(body?.sizeTable ?? null);
    const submittedNormalizedSizeTable = parseSizeTable(body?.normalizedSizeTable ?? null);
    const normalizedSizeTable = normalizeSizeTableForCategory(
      category,
      submittedNormalizedSizeTable || sizeTable
    );
    const isInstagram = false;
    const createdAt = new Date().toISOString();

    if (!brand || !name) {
      return NextResponse.json(
        {
          ok: false,
          error: "brand and name are required",
        },
        { status: 400 }
      );
    }

    const slug = await generateProductSlug(brand, name);
    const insertedRow = await insertProductRow({
      brand,
      name,
      category,
      url,
      image,
      imagePath,
      sizeTable,
      normalizedSizeTable,
      isInstagram,
      createdAt,
      slug,
      registeredBy,
    });
    const product = normalizeProductRow(insertedRow);

    revalidatePath("/", "layout");
    return NextResponse.json(
      {
        ok: true,
        data: { product },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const { statusCode, message } = toProductWriteErrorResponse(error, "product insert error");
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: statusCode }
    );
  }
}
