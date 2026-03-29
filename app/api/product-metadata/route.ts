import { NextResponse } from "next/server";
import { createMetadataStack } from "../../../server/bootstrap/metadata.js";

const { extractProductMetadataFromUrl, normalizeProductCategory } = createMetadataStack();

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const rawUrl = String(body?.url || "").trim();

  try {
    const metadata = await extractProductMetadataFromUrl(rawUrl);

    return NextResponse.json({
      ok: true,
      data: {
        url: metadata.url || "",
        brand: metadata.brand || "",
        name: metadata.name || "",
        category: normalizeProductCategory(metadata.category || ""),
        image_path: metadata.image_path || "",
        productImage: metadata.productImage || null,
        productImageCandidates: Array.isArray(metadata.productImageCandidates)
          ? metadata.productImageCandidates
          : [],
      },
    });
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500;
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "product metadata extraction error",
      },
      { status: statusCode }
    );
  }
}
