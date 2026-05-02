import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  alignAndValidateSizeTableByOptionLabels,
  extractProductMetadataFromImageWithGemini,
  extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini,
} from "../../../server/bootstrap/gemini.js";
import {
  fetchLinkedSizeMetadataDeep,
  normalizeBrandName,
  normalizeProductCategory,
  prioritizeProductImageCandidates,
  refreshBrandRulesCache,
  resolveProductMetadataFromHints,
} from "../../../server/bootstrap/metadata.js";
import { getBearerTokenFromRequest, validateInlineImageInput } from "../../../server/utils/request-validation.js";
import { verifyRegisteredBearerToken } from "../../../server/utils/verify-auth.js";

const normalizeCellText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const pickFirstNonEmpty = (values: unknown[]) => {
  for (const value of values) {
    const normalized = normalizeCellText(value);
    if (normalized) return normalized;
  }
  return "";
};

export const maxDuration = 60;

export async function POST(request: Request) {
  const token = getBearerTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });
  }
  const user = await verifyRegisteredBearerToken(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const { imageBase64, mimeType } = validateInlineImageInput(body);
    await refreshBrandRulesCache();
    const metadataResult = await extractProductMetadataFromImageWithGemini({ imageBase64, mimeType });
    if (!metadataResult?.data) {
      return NextResponse.json(
        {
          ok: false,
          error: metadataResult?.error || "Gemini did not return product metadata",
        },
        { status: 502 }
      );
    }

    let fallbackUrlMetadata: any = null;
    let linkedSizeMetadata = {
      sizeTable: null,
      sizeChartImageCandidates: [] as string[],
      visitedPages: [] as string[],
    };
    let linkedImageTableResult = {
      table: null,
      sourceUrl: "",
    };

    const rawImagePath = normalizeCellText(metadataResult.data.image_path || "");
    const rawProductUrl = normalizeCellText(metadataResult.data.url || "");
    const resolvedHintMetadata = await resolveProductMetadataFromHints({
      brand: metadataResult.data.brand || "",
      name: metadataResult.data.name || "",
      category: metadataResult.data.category || "",
      preferredUrl: rawProductUrl,
    });
    fallbackUrlMetadata = resolvedHintMetadata.metadata;

    const effectiveProductUrl = pickFirstNonEmpty([fallbackUrlMetadata?.url || "", rawProductUrl]);
    if (effectiveProductUrl) {
      try {
        linkedSizeMetadata = await fetchLinkedSizeMetadataDeep(effectiveProductUrl, {
          maxDepth: 2,
          maxPages: 4,
        });
      } catch {
        linkedSizeMetadata = {
          sizeTable: null,
          sizeChartImageCandidates: [],
          visitedPages: [],
        };
      }
    }

    let sizeTable =
      alignAndValidateSizeTableByOptionLabels(linkedSizeMetadata.sizeTable, []) ||
      alignAndValidateSizeTableByOptionLabels(metadataResult.data.sizeTable, []) ||
      null;

    if (!sizeTable && linkedSizeMetadata.sizeChartImageCandidates.length > 0) {
      linkedImageTableResult = await extractSizeTableFromImageCandidates(
        linkedSizeMetadata.sizeChartImageCandidates,
        { limit: 3 }
      );
      sizeTable = alignAndValidateSizeTableByOptionLabels(linkedImageTableResult.table, []) || null;
    }

    if (!sizeTable) {
      const tableResult = await extractSizeTableWithGemini({ imageBase64, mimeType });
      sizeTable = alignAndValidateSizeTableByOptionLabels(tableResult.table, []) || null;
    }

    const productImageSourceBonusByUrl = new Map<string, number>();
    if (rawImagePath) {
      productImageSourceBonusByUrl.set(
        rawImagePath,
        Math.max(10, Number(productImageSourceBonusByUrl.get(rawImagePath) || 0))
      );
    }

    const candidateImageUrls: string[] = [rawImagePath];

    const prioritizedImageResult = await (prioritizeProductImageCandidates as any)({
      primaryImage: null,
      candidates: candidateImageUrls,
      brand: metadataResult.data.brand || fallbackUrlMetadata?.brand || "",
      name: metadataResult.data.name || fallbackUrlMetadata?.name || "",
      sourceBonusByUrl: productImageSourceBonusByUrl,
    });

    const imagePath = prioritizedImageResult.imagePath || "";
    const productImage = imagePath ? { sourceUrl: imagePath, mimeType: "", base64: "" } : null;
    const productImageCandidates = prioritizedImageResult.productImageCandidates;
    const resolvedBrand = normalizeBrandName(metadataResult.data.brand || fallbackUrlMetadata?.brand || "");

    return NextResponse.json({
      ok: true,
      data: {
        brand: resolvedBrand,
        name: metadataResult.data.name || fallbackUrlMetadata?.name || "",
        category: normalizeProductCategory(
          metadataResult.data.category || fallbackUrlMetadata?.category || ""
        ),
        url: effectiveProductUrl || "",
        image_path: imagePath || "",
        product_image_bbox: metadataResult.data.product_image_bbox || null,
        size_chart_bbox: metadataResult.data.size_chart_bbox || null,
        productImage,
        productImageCandidates,
        sizeTable: sizeTable || null,
        debug: {
          productImageSource:
            fallbackUrlMetadata?.productImage?.sourceUrl === imagePath
              ? "linked-page"
              : rawImagePath && rawImagePath === imagePath
                ? "screenshot-visible-url"
                : imagePath
                  ? "linked-page-candidate"
                  : "none",
          sizeTableSource: linkedSizeMetadata.sizeTable
            ? "linked-page-html"
            : linkedImageTableResult.table
              ? "linked-size-chart-image"
              : metadataResult.data.sizeTable
                ? "screenshot"
                : sizeTable
                  ? "screenshot-fallback"
                  : "none",
          linkedSizeChartImageCandidates: linkedSizeMetadata.sizeChartImageCandidates.slice(0, 5),
          linkedSizePages: linkedSizeMetadata.visitedPages.slice(0, 5),
          searchedProductPageCandidates: resolvedHintMetadata.candidateUrls.slice(0, 5),
          discardedScreenshotImagePath: rawImagePath || "",
        },
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "product-metadata-from-image error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}
