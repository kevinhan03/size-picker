import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  extractProductMetadataFromUrl,
  normalizeProductCategory,
  refreshBrandRulesCache,
} from "../../../server/bootstrap/metadata.js";
import { getBearerTokenFromRequest } from "../../../server/utils/request-validation.js";
import { verifyBearerToken } from "../../../server/utils/verify-auth.js";

export const maxDuration = 60;

export async function POST(request: Request) {
  const token = getBearerTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });
  }
  const user = await verifyBearerToken(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: "invalid auth token" }, { status: 401 });
  }

  const body = await request.json();
  const rawUrl = String(body?.url || "").trim();

  try {
    await refreshBrandRulesCache();
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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "product metadata extraction error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}
