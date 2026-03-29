import {
  normalizeProductCategory,
  normalizeBrandName,
  refreshBrandRulesCache,
  extractProductMetadataFromUrl,
  fetchLinkedSizeMetadataDeep,
  prioritizeProductImageCandidates,
  resolveProductMetadataFromHints,
} from "../shared.js";

export const createMetadataStack = () => ({
  normalizeProductCategory,
  normalizeBrandName,
  refreshBrandRulesCache,
  extractProductMetadataFromUrl,
  fetchLinkedSizeMetadataDeep,
  prioritizeProductImageCandidates,
  resolveProductMetadataFromHints,
});
