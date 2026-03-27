import {
  IS_VERCEL,
  PRODUCT_METADATA_BROWSER_TIMEOUT_MS,
  PRODUCT_METADATA_MAX_IMAGE_BYTES,
  PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
  PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS,
  PRODUCT_METADATA_SEARCH_RESULT_LIMIT,
  PRODUCT_METADATA_URL_FAST_MODE,
} from "../config/env.js";
import { createProductMetadataService } from "../services/product-metadata.js";
import { launchMetadataBrowser } from "../services/product-metadata/browser.js";
import {
  extractZaraMetadataFromInditexApi,
  isKreamProductUrl,
  isZaraProductUrl,
} from "../services/product-metadata/stores.js";
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
  isStrongProductOnlyProductImageCandidate,
  sortProductImageCandidates,
  sortSizeChartImageCandidates,
} from "../services/product-metadata/images.js";
import {
  buildProductSearchQueries,
  extractSearchResultUrls,
  scoreProductPageSearchCandidate,
} from "../services/product-metadata/search.js";
import {
  inferProductCategory,
  normalizeBrandName,
  normalizeProductCategory,
  pickFirstNonEmpty,
  uniqValues,
} from "../services/product-metadata/shared.js";
import {
  assertPublicHttpUrl,
  fetchWithTimeout,
  normalizePreferredStoreUrl,
  normalizeUrlCandidate,
  toWwwHostUrl,
} from "../services/product-metadata/url.js";
import {
  alignAndValidateSizeTableByOptionLabels,
  collectTextBlocksFromJsonData,
  extractSizeTableFromPage,
} from "../services/size-table/extraction.js";
import { normalizeCellText } from "../utils/size-table.js";

const SIZE_HINT_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|chart|guide|measurement|spec|\bcm\b)/i;

export function createMetadataStack({
  downloadImageAsBase64Payload,
  extractProductMetadataFromImageWithGemini,
  extractSizeTableWithGemini,
  prioritizeProductImageCandidates,
  selectFirstImagePayload,
}) {
  return createProductMetadataService({
    addImageResolutionVariants,
    alignAndValidateSizeTableByOptionLabels,
    assertPublicHttpUrl,
    buildProductSearchQueries,
    collectTextBlocksFromJsonData,
    downloadImageAsBase64Payload,
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
    extractSizeTableFromPage,
    extractSizeTableWithGemini,
    extractZaraMetadataFromInditexApi: (pageUrl) =>
      extractZaraMetadataFromInditexApi(pageUrl, {
        normalizeCellText,
        normalizeProductCategory,
      }),
    fetchWithTimeout,
    inferProductCategory,
    IS_VERCEL,
    isKreamProductUrl,
    isLikelyProductImageUrl,
    isLikelySizeChartImageUrl,
    isStrongProductOnlyProductImageCandidate,
    isZaraProductUrl,
    launchMetadataBrowser,
    normalizeBrandName,
    normalizeCellText,
    normalizePreferredStoreUrl,
    normalizeProductCategory,
    normalizeUrlCandidate,
    pickFirstNonEmpty,
    prioritizeProductImageCandidates,
    PRODUCT_METADATA_BROWSER_TIMEOUT_MS,
    PRODUCT_METADATA_MAX_IMAGE_BYTES,
    PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
    PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
    PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
    PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
    PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS,
    PRODUCT_METADATA_SEARCH_RESULT_LIMIT,
    PRODUCT_METADATA_URL_FAST_MODE,
    scoreProductPageSearchCandidate,
    selectFirstImagePayload,
    SIZE_HINT_PATTERN,
    sortProductImageCandidates,
    sortSizeChartImageCandidates,
    toWwwHostUrl,
    uniqValues,
  });
}
