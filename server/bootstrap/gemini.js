import { GEMINI_API_BASE, GEMINI_API_KEY } from "../config/env.js";
import { createGeminiService } from "../services/gemini.js";
import { createImageDownloadService } from "../services/product-metadata/image-download.js";
import { normalizeProductCategory } from "../services/product-metadata/shared.js";
import { alignAndValidateSizeTableByOptionLabels } from "../services/size-table/extraction.js";
import {
  normalizeCaptureBoundingBox,
  normalizeProductImageGeminiAssessment,
  PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES,
  PRODUCT_IMAGE_GEMINI_PROMPT,
  PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA,
  PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT,
  PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA,
  SIZE_TABLE_GEMINI_MODEL_CANDIDATES,
  SIZE_TABLE_GEMINI_PROMPT_CANDIDATES,
  SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
  standardizeSizeTable,
} from "../services/gemini-config.js";
import { assertPublicHttpUrl, fetchWithTimeout } from "../services/product-metadata/url.js";
import { normalizeCellText } from "../utils/size-table.js";

const gemini = createGeminiService({
  assertPublicHttpUrl,
  GEMINI_API_BASE,
  GEMINI_API_KEY,
  normalizeCaptureBoundingBox,
  normalizeCellText,
  normalizeProductCategory,
  PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT,
  PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA,
  PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK: true,
  PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES,
  PRODUCT_IMAGE_GEMINI_PROMPT,
  PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA,
  SIZE_TABLE_GEMINI_MODEL_CANDIDATES,
  SIZE_TABLE_GEMINI_PROMPT_CANDIDATES,
  SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
  standardizeSizeTable,
  normalizeProductImageGeminiAssessment,
});

const imageDownload = createImageDownloadService({
  assessProductImageWithGemini: gemini.assessProductImageWithGemini,
  assertPublicHttpUrl,
  fetchWithTimeout,
  GEMINI_API_KEY,
});

export const extractSizeTableFromImageCandidates = async (imageCandidates, { limit = 3 } = {}) => {
  const normalizedCandidates = [...new Set((imageCandidates || []).filter(Boolean))];
  for (const candidate of normalizedCandidates.slice(0, Math.max(1, Number(limit) || 1))) {
    let payload = null;
    try {
      payload = await imageDownload.downloadImageAsBase64Payload(candidate, {
        minBytes: 1024,
        maxBytes: Number(process.env.PRODUCT_METADATA_MAX_IMAGE_BYTES || 8 * 1024 * 1024),
        minWidth: 160,
        minHeight: 160,
        maxAspectRatio: 6,
        includeBase64: true,
      });
    } catch {
      payload = null;
    }

    if (!payload?.base64) continue;

    const tableResult = await gemini.extractSizeTableWithGemini({
      imageBase64: payload.base64,
      mimeType: payload.mimeType || "image/png",
    });
    const validatedTable = alignAndValidateSizeTableByOptionLabels(tableResult.table, []) || null;
    if (validatedTable) {
      return {
        table: validatedTable,
        sourceUrl: payload.sourceUrl || candidate,
      };
    }
  }

  return { table: null, sourceUrl: "" };
};

export const assertGeminiKey = gemini.assertGeminiKey;
export const callGemini = gemini.callGemini;
export const extractProductMetadataFromImageWithGemini =
  gemini.extractProductMetadataFromImageWithGemini;
export const extractSizeTableWithGemini = gemini.extractSizeTableWithGemini;
export { alignAndValidateSizeTableByOptionLabels };
