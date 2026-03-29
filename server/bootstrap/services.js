import { adminLoginLimiter, geminiLimiter, productInsertLimiter } from "../config/limits.js";
import {
  assertAdminConfig,
  clearAdminCookie,
  getAdminTokenFromRequest,
  makeAdminCookie,
  makeAdminSessionToken,
  safeCompare,
  verifyAdminSessionToken,
} from "../auth/admin-session.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeProductCategory, pickFirstNonEmpty } from "../services/product-metadata/shared.js";
import { alignAndValidateSizeTableByOptionLabels } from "../services/size-table/extraction.js";
import { normalizeCellText, parseSizeTable } from "../utils/size-table.js";
import { createGeminiStack } from "./gemini.js";
import { createMetadataStack } from "./metadata.js";
import { createProductStack } from "./products.js";

export function createServices() {
  const gemini = createGeminiStack();
  const products = createProductStack();
  const metadata = createMetadataStack({
    downloadImageAsBase64Payload: gemini.downloadImageAsBase64Payload,
    extractProductMetadataFromImageWithGemini: gemini.extractProductMetadataFromImageWithGemini,
    extractSizeTableWithGemini: gemini.extractSizeTableWithGemini,
    prioritizeProductImageCandidates: gemini.prioritizeProductImageCandidates,
    selectFirstImagePayload: gemini.selectFirstImagePayload,
  });

  return {
    adminLoginLimiter,
    alignAndValidateSizeTableByOptionLabels,
    assertAdminConfig,
    assertSupabaseConfig,
    clearAdminCookie,
    ...gemini,
    ...metadata,
    ...products,
    geminiLimiter,
    getAdminTokenFromRequest,
    makeAdminCookie,
    makeAdminSessionToken,
    normalizeCellText,
    normalizeProductCategory,
    parseSizeTable,
    pickFirstNonEmpty,
    productInsertLimiter,
    requireAdminAuth,
    safeCompare,
    supabase,
    verifyAdminSessionToken,
  };
}
