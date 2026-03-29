export const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
export const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
export const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
export const SUPABASE_PRODUCTS_TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
export const SUPABASE_STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
export const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
export const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || "").trim();
export const ADMIN_SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 60 * 60 * 8);
