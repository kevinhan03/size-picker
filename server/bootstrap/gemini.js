import {
  alignAndValidateSizeTableByOptionLabels,
  assertGeminiKey,
  callGemini,
  extractProductMetadataFromImageWithGemini,
  extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini,
} from "../shared.js";

export const createGeminiStack = () => ({
  alignAndValidateSizeTableByOptionLabels,
  assertGeminiKey,
  callGemini,
  extractProductMetadataFromImageWithGemini,
  extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini,
});
