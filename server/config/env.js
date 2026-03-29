export const PORT = Number(process.env.PORT || 8787);
export const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
export const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
export const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
export const SUPABASE_PRODUCTS_TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
export const SUPABASE_STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
export const SUBMISSIONS_STORAGE_PREFIX = "submissions/";
export const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
export const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || "").trim();
export const ADMIN_SESSION_COOKIE_NAME = "sizepicker_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 60 * 60 * 8);
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_VERCEL = Boolean(process.env.VERCEL);
export const PRODUCT_METADATA_FETCH_TIMEOUT_MS = Number(process.env.PRODUCT_METADATA_FETCH_TIMEOUT_MS || 12000);
export const PRODUCT_METADATA_MAX_IMAGE_BYTES = Number(process.env.PRODUCT_METADATA_MAX_IMAGE_BYTES || 8 * 1024 * 1024);
export const PRODUCT_METADATA_MAX_SIZE_CHART_PAGES = Number(process.env.PRODUCT_METADATA_MAX_SIZE_CHART_PAGES || 3);
export const PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_BYTES = Number(process.env.PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_BYTES || 12 * 1024);
export const PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_WIDTH = Number(process.env.PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_WIDTH || 320);
export const PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_HEIGHT = Number(process.env.PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_HEIGHT || 120);
export const PRODUCT_METADATA_MAX_SIZE_CHART_IMAGE_ASPECT_RATIO = Number(process.env.PRODUCT_METADATA_MAX_SIZE_CHART_IMAGE_ASPECT_RATIO || 6);
export const PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES = Number(process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES || 8 * 1024);
export const PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH = Number(process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH || 240);
export const PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT = Number(process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT || 240);
export const PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO = Number(process.env.PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2);
export const PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES = Number(process.env.PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES || 10);
export const PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK =
  String(process.env.PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK || "true").toLowerCase() !== "false";
export const PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT = Number(process.env.PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT || 10);
export const PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT = Number(process.env.PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT || 12);
export const PRODUCT_METADATA_SEARCH_RESULT_LIMIT = Number(process.env.PRODUCT_METADATA_SEARCH_RESULT_LIMIT || 6);
export const PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS = Number(process.env.PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS || 10000);
export const PRODUCT_METADATA_BROWSER_TIMEOUT_MS = Number(process.env.PRODUCT_METADATA_BROWSER_TIMEOUT_MS || 12000);
export const PRODUCT_METADATA_URL_FAST_MODE =
  String(process.env.PRODUCT_METADATA_URL_FAST_MODE || "true").toLowerCase() !== "false";
export const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
