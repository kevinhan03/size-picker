import { NextResponse } from "next/server";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";
import { generateProductSlug, insertProductRow, normalizeProductRow, toProductWriteErrorResponse } from "../../../../server/utils/product.js";
import { normalizeBrandName, refreshBrandRulesCache } from "../../../../server/utils/brand-rules.js";
import { parseSizeTable } from "../../../../server/utils/size-table.js";

export async function POST(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const body = await request.json();
  const brand = String(body?.brand || "").trim();
  const name = String(body?.name || "").trim();
  const category = String(body?.category || "").trim();
  const url = String(body?.url || "").trim() || null;
  const imagePath = String(body?.imagePath || "").trim() || null;
  const sizeTable = parseSizeTable(body?.sizeTable ?? null);

  if (!brand) return NextResponse.json({ ok: false, error: "brand is required" }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
  if (!category) return NextResponse.json({ ok: false, error: "category is required" }, { status: 400 });
  if (!imagePath) return NextResponse.json({ ok: false, error: "image is required" }, { status: 400 });

  try {
    await refreshBrandRulesCache();
    const normalizedBrand = normalizeBrandName(brand);
    const slug = await generateProductSlug(normalizedBrand, name);
    const createdAt = new Date().toISOString();
    const row = await insertProductRow({
      brand: normalizedBrand,
      name,
      category,
      url,
      image: "",
      imagePath,
      sizeTable,
      isInstagram: true,
      createdAt,
      slug,
    });
    const product = normalizeProductRow(row);
    return NextResponse.json({ ok: true, data: { product } });
  } catch (error: unknown) {
    const { statusCode, message } = toProductWriteErrorResponse(error, "instagram product creation failed");
    return NextResponse.json({ ok: false, error: message }, { status: statusCode });
  }
}
