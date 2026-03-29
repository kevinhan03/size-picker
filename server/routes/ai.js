import { IS_PRODUCTION } from "../config/env.js";

export function registerAiRoutes(app, {
  alignAndValidateSizeTableByOptionLabels,
  assertGeminiKey,
  callGemini,
  extractProductMetadataFromImageWithGemini,
  extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini,
  fetchLinkedSizeMetadataDeep,
  geminiLimiter,
  normalizeCellText,
  normalizeProductCategory,
  pickFirstNonEmpty,
  prioritizeProductImageCandidates,
  resolveProductMetadataFromHints,
}) {
  app.post("/api/size-table", geminiLimiter, async (req, res) => {
    const imageBase64 = String(req.body?.imageBase64 || "").trim();
    const mimeType = String(req.body?.mimeType || "image/png").trim();

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "imageBase64 is required" });
    }

    try {
      const result = await extractSizeTableWithGemini({ imageBase64, mimeType });
      const validatedTable = alignAndValidateSizeTableByOptionLabels(result.table, []);
      if (!validatedTable) {
        return res.status(502).json({
          ok: false,
          error: result.error || "Gemini did not return a valid size table",
        });
      }

      return res.json({
        ok: true,
        data: validatedTable,
      });
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;
      return res.status(statusCode).json({
        ok: false,
        error: error?.message || "size-table error",
      });
    }
  });

  app.post("/api/product-metadata-from-image", geminiLimiter, async (req, res) => {
    const imageBase64 = String(req.body?.imageBase64 || "").trim();
    const mimeType = String(req.body?.mimeType || "image/png").trim();

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "imageBase64 is required" });
    }

    try {
      const metadataResult = await extractProductMetadataFromImageWithGemini({ imageBase64, mimeType });
      if (!metadataResult?.data) {
        return res.status(502).json({
          ok: false,
          error: metadataResult?.error || "Gemini did not return product metadata",
        });
      }

      let fallbackUrlMetadata = null;
      let linkedSizeMetadata = {
        sizeTable: null,
        sizeChartImageCandidates: [],
        visitedPages: [],
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

      const effectiveProductUrl = pickFirstNonEmpty([
        fallbackUrlMetadata?.url || "",
        rawProductUrl,
      ]);
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
        sizeTable =
          alignAndValidateSizeTableByOptionLabels(linkedImageTableResult.table, []) || null;
      }
      if (!sizeTable) {
        const tableResult = await extractSizeTableWithGemini({ imageBase64, mimeType });
        sizeTable = alignAndValidateSizeTableByOptionLabels(tableResult.table, []) || null;
      }

      const productImageSourceBonusByUrl = new Map();
      if (fallbackUrlMetadata?.image_path) {
        productImageSourceBonusByUrl.set(fallbackUrlMetadata.image_path, 14);
      }
      for (const candidate of fallbackUrlMetadata?.productImageCandidates || []) {
        productImageSourceBonusByUrl.set(
          candidate,
          Math.max(10, Number(productImageSourceBonusByUrl.get(candidate) || 0))
        );
      }
      if (rawImagePath) {
        productImageSourceBonusByUrl.set(
          rawImagePath,
          Math.max(6, Number(productImageSourceBonusByUrl.get(rawImagePath) || 0))
        );
      }
      const prioritizedImageResult = await prioritizeProductImageCandidates({
        primaryImage: fallbackUrlMetadata?.productImage || null,
        candidates: [
          rawImagePath,
          fallbackUrlMetadata?.image_path || "",
          ...(fallbackUrlMetadata?.productImageCandidates || []),
        ],
        brand: metadataResult.data.brand || fallbackUrlMetadata?.brand || "",
        name: metadataResult.data.name || fallbackUrlMetadata?.name || "",
        sourceBonusByUrl: productImageSourceBonusByUrl,
      });
      const imagePath = prioritizedImageResult.imagePath || "";
      const productImage =
        fallbackUrlMetadata?.productImage?.sourceUrl === imagePath
          ? fallbackUrlMetadata.productImage
          : imagePath
            ? { sourceUrl: imagePath, mimeType: "", base64: "" }
            : null;
      const productImageCandidates = prioritizedImageResult.productImageCandidates;

      const responseData = {
        brand: metadataResult.data.brand || fallbackUrlMetadata?.brand || "",
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
      };

      if (!IS_PRODUCTION) {
        responseData.debug = {
          productImageSource: fallbackUrlMetadata?.productImage?.sourceUrl === imagePath
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
        };
      }

      return res.json({ ok: true, data: responseData });
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;
      return res.status(statusCode).json({
        ok: false,
        error: error?.message || "product-metadata-from-image error",
      });
    }
  });

  app.post("/api/remove-bg", geminiLimiter, async (req, res) => {
    const imageBase64 = String(req.body?.imageBase64 || "").trim();
    const mimeType = String(req.body?.mimeType || "image/png").trim();

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "imageBase64 is required" });
    }

    try {
      assertGeminiKey();

      const response = await callGemini("gemini-2.5-flash-image-preview", {
        contents: [
          {
            parts: [
              {
                text:
                  "Remove background from this product image. Keep only the product and produce clean output.",
              },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      });

      if (!response.ok) {
        const detail = await response.text();
        return res.status(502).json({
          ok: false,
          data: { imageBase64 },
          error: "Gemini remove-bg request failed",
          detail,
        });
      }

      const payload = await response.json();
      const outputBase64 =
        payload?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data)
          ?.inlineData?.data || "";

      if (!outputBase64) {
        return res.status(502).json({
          ok: false,
          data: { imageBase64 },
          error: "Gemini remove-bg returned empty image",
        });
      }

      return res.json({
        ok: true,
        data: { imageBase64: outputBase64 },
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        data: { imageBase64 },
        error: error?.message || "remove-bg error",
      });
    }
  });
}
