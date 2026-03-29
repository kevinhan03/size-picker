import {
  normalizeProductCategory,
  normalizeBrandName,
  extractProductMetadataFromUrl,
  fetchLinkedSizeMetadataDeep,
  prioritizeProductImageCandidates,
  resolveProductMetadataFromHints,
} from "../shared.js";

export const createMetadataStack = () => ({
  normalizeProductCategory,
  normalizeBrandName,
  extractProductMetadataFromUrl,
  fetchLinkedSizeMetadataDeep,
  prioritizeProductImageCandidates,
  resolveProductMetadataFromHints,
});
