import { NextResponse } from "next/server";
import { createProductStack } from "../../../server/bootstrap/products.js";

const {
  fetchProductsRows,
  insertProductRow,
  normalizeBrandName,
  normalizeProductRow,
  toProductWriteErrorResponse,
} =
  createProductStack();

export async function GET() {
  try {
    const rows = await fetchProductsRows();
    const products = rows
      .map((row: unknown) => normalizeProductRow(row))
      .filter((product: unknown) => product !== null);

    return NextResponse.json({
      ok: true,
      data: { products },
    });
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500;
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "products fetch error",
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const url = String(body?.url || "#").trim();
  const brand = normalizeBrandName(String(body?.brand || "").trim(), { url });
  const name = String(body?.name || "").trim();
  const category = String(body?.category || "User Uploaded").trim();
  const imagePath = String(body?.image_path ?? body?.imagePath ?? "").trim();
  const image = String(body?.image || "").trim();
  const sizeTable = body?.sizeTable ?? null;
  const createdAt = String(body?.createdAt || new Date().toISOString()).trim();

  if (!brand || !name) {
    return NextResponse.json(
      {
        ok: false,
        error: "brand and name are required",
      },
      { status: 400 }
    );
  }

  try {
    const insertedRow = await insertProductRow({
      brand,
      name,
      category,
      url,
      image,
      imagePath,
      sizeTable,
      createdAt,
    });
    const product = normalizeProductRow(insertedRow);

    return NextResponse.json(
      {
        ok: true,
        data: { product },
      },
      { status: 201 }
    );
  } catch (error: any) {
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
