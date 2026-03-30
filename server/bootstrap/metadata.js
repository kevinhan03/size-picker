import { IS_VERCEL } from "../config/env.js";
import { createGeminiService } from "../services/gemini.js";
import { createProductMetadataService } from "../services/product-metadata.js";
import { launchMetadataBrowser } from "../services/product-metadata/browser.js";
import {
  extractBrandFromDescription,
  extractHtmlTitle,
  extractJsonObjectsFromApplicationScripts,
  extractMetaContent,
  extractMusinsaPageData,
  extractNextDataPayload,
  extractProductJsonLd,
} from "../services/product-metadata/html.js";
import {
  addImageResolutionVariants,
  extractImageCandidatesFromHtml,
  extractImageCandidatesFromJsonData,
  extractProductImageCandidatesFromHtml,
  extractProductNameFromTitle,
  extractSizeChartPageCandidatesFromHtml,
  extractSizeChartPageCandidatesFromJsonData,
  isLikelyProductImageUrl,
  isLikelySizeChartImageUrl,
  sortProductImageCandidates,
  sortSizeChartImageCandidates,
  SIZE_HINT_PATTERN,
} from "../services/product-metadata/images.js";
import { createImageDownloadService } from "../services/product-metadata/image-download.js";
import { createProductImageRankingService } from "../services/product-metadata/image-ranking.js";
import { buildProductSearchQueries, extractSearchResultUrls, scoreProductPageSearchCandidate } from "../services/product-metadata/search.js";
import { inferProductCategory, normalizeProductCategory, pickFirstNonEmpty, uniqValues } from "../services/product-metadata/shared.js";
import { extractZaraMetadataFromInditexApi, isKreamProductUrl, isZaraProductUrl } from "../services/product-metadata/stores.js";
import { alignAndValidateSizeTableByOptionLabels, collectTextBlocksFromJsonData, extractSizeTableFromPage } from "../services/size-table/extraction.js";
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
import { normalizeBrandName, refreshBrandRulesCache } from "../utils/brand-rules.js";
import { normalizeCellText } from "../utils/size-table.js";
import { assertPublicHttpUrl, fetchWithTimeout, normalizePreferredStoreUrl, normalizeUrlCandidate, toWwwHostUrl } from "../services/product-metadata/url.js";
import {
  extractProductMetadataFromImageWithGemini,
  extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini,
} from "./gemini.js";

const geminiService = createGeminiService({
    assertPublicHttpUrl,
    GEMINI_API_BASE: process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
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
    assessProductImageWithGemini: geminiService.assessProductImageWithGemini,
    assertPublicHttpUrl,
    fetchWithTimeout,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  });
const imageRanking = createProductImageRankingService({
    assessProductImageWithGemini: geminiService.assessProductImageWithGemini,
    downloadImageAsBase64Payload: imageDownload.downloadImageAsBase64Payload,
    selectTopUsableImageUrls: imageDownload.selectTopUsableImageUrls,
  });

const service = createProductMetadataService({
    addImageResolutionVariants,
    alignAndValidateSizeTableByOptionLabels,
    assertPublicHttpUrl,
    buildProductSearchQueries,
    collectTextBlocksFromJsonData,
    downloadImageAsBase64Payload: imageDownload.downloadImageAsBase64Payload,
    extractBrandFromDescription,
    extractHtmlTitle,
    extractImageCandidatesFromHtml,
    extractImageCandidatesFromJsonData,
    extractJsonObjectsFromApplicationScripts,
    extractMetaContent,
    extractMusinsaPageData,
    extractNextDataPayload,
    extractProductImageCandidatesFromHtml,
    extractProductJsonLd,
    extractProductMetadataFromImageWithGemini,
    extractProductNameFromTitle,
    extractSearchResultUrls,
    extractSizeChartPageCandidatesFromHtml,
    extractSizeChartPageCandidatesFromJsonData,
    extractSizeTableFromImageCandidates,
    extractSizeTableFromPage,
    extractSizeTableWithGemini,
    extractZaraMetadataFromInditexApi,
    fetchWithTimeout,
    inferProductCategory,
    IS_VERCEL,
    isKreamProductUrl,
    isLikelyProductImageUrl,
    isLikelySizeChartImageUrl,
    isZaraProductUrl,
    launchMetadataBrowser,
    normalizeBrandName,
    normalizeCellText,
    normalizePreferredStoreUrl,
    normalizeProductCategory,
    normalizeUrlCandidate,
    pickFirstNonEmpty,
    prioritizeProductImageCandidates: imageRanking.prioritizeProductImageCandidates,
    PRODUCT_METADATA_BROWSER_TIMEOUT_MS: Number(process.env.PRODUCT_METADATA_BROWSER_TIMEOUT_MS || 12000),
    PRODUCT_METADATA_MAX_IMAGE_BYTES: Number(process.env.PRODUCT_METADATA_MAX_IMAGE_BYTES || 8 * 1024 * 1024),
    PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO: Number(process.env.PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2),
    PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES: Number(process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES || 8 * 1024),
    PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT: Number(process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT || 240),
    PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH: Number(process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH || 240),
    PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS: Number(process.env.PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS || 10000),
    PRODUCT_METADATA_SEARCH_RESULT_LIMIT: Number(process.env.PRODUCT_METADATA_SEARCH_RESULT_LIMIT || 6),
    PRODUCT_METADATA_URL_FAST_MODE: String(process.env.PRODUCT_METADATA_URL_FAST_MODE || "true").toLowerCase() !== "false",
    scoreProductPageSearchCandidate,
    selectFirstImagePayload: imageDownload.selectFirstImagePayload,
    SIZE_HINT_PATTERN,
    sortProductImageCandidates,
    sortSizeChartImageCandidates,
    toWwwHostUrl,
    uniqValues,
  });

export { normalizeProductCategory, normalizeBrandName, refreshBrandRulesCache };
export const prioritizeProductImageCandidates = imageRanking.prioritizeProductImageCandidates;
export const extractProductMetadataFromUrl = service.extractProductMetadataFromUrl;
export const extractProductMetadataFromUrlWithBrowser = service.extractProductMetadataFromUrlWithBrowser;
export const fetchLinkedSizeMetadataDeep = service.fetchLinkedSizeMetadataDeep;
export const resolveProductMetadataFromHints = service.resolveProductMetadataFromHints;
