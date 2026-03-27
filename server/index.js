import { createApp } from "./config/app.js";
import { IS_VERCEL, PORT } from "./config/env.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerProductRoutes } from "./routes/products.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerMetadataRoutes } from "./routes/metadata.js";
import { registerAiRoutes } from "./routes/ai.js";
import { createServices } from "./bootstrap/services.js";

const app = createApp();
const services = createServices();

registerAuthRoutes(app, {
  supabase: services.supabase,
  assertSupabaseConfig: services.assertSupabaseConfig,
});

registerMetadataRoutes(app, {
  extractProductMetadataFromUrl: services.extractProductMetadataFromUrl,
  normalizeProductCategory: services.normalizeProductCategory,
});

registerProductRoutes(app, {
  fetchProductsRows: services.fetchProductsRows,
  insertProductRow: services.insertProductRow,
  parseSizeTable: services.parseSizeTable,
  productInsertLimiter: services.productInsertLimiter,
  toProductWriteErrorResponse: services.toProductWriteErrorResponse,
});

registerAdminRoutes(app, {
  adminLoginLimiter: services.adminLoginLimiter,
  assertAdminConfig: services.assertAdminConfig,
  assertSupabaseConfig: services.assertSupabaseConfig,
  clearAdminCookie: services.clearAdminCookie,
  getAdminTokenFromRequest: services.getAdminTokenFromRequest,
  makeAdminCookie: services.makeAdminCookie,
  makeAdminSessionToken: services.makeAdminSessionToken,
  normalizeStoragePath: services.normalizeStoragePath,
  parseSizeTable: services.parseSizeTable,
  removeOldProductImageIfUnused: services.removeOldProductImageIfUnused,
  requireAdminAuth: services.requireAdminAuth,
  safeCompare: services.safeCompare,
  supabase: services.supabase,
  toProductWriteErrorResponse: services.toProductWriteErrorResponse,
  verifyAdminSessionToken: services.verifyAdminSessionToken,
});

registerAiRoutes(app, {
  alignAndValidateSizeTableByOptionLabels: services.alignAndValidateSizeTableByOptionLabels,
  assertGeminiKey: services.assertGeminiKey,
  callGemini: services.callGemini,
  extractProductMetadataFromImageWithGemini: services.extractProductMetadataFromImageWithGemini,
  extractSizeTableFromImageCandidates: services.extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini: services.extractSizeTableWithGemini,
  fetchLinkedSizeMetadataDeep: services.fetchLinkedSizeMetadataDeep,
  geminiLimiter: services.geminiLimiter,
  normalizeCellText: services.normalizeCellText,
  normalizeProductCategory: services.normalizeProductCategory,
  pickFirstNonEmpty: services.pickFirstNonEmpty,
  prioritizeProductImageCandidates: services.prioritizeProductImageCandidates,
  resolveProductMetadataFromHints: services.resolveProductMetadataFromHints,
});

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

export default app;
