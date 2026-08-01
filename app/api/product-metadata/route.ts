import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  extractProductMetadataFromUrl,
  normalizeProductCategory,
  refreshBrandRulesCache,
} from "../../../server/bootstrap/metadata.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../server/auth/request-user";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  const user = await getRegisteredRequestUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
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
        taggingTextCandidates: Array.isArray(metadata.taggingTextCandidates)
          ? metadata.taggingTextCandidates
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
