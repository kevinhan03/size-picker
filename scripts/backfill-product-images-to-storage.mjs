/**
 * Copies legacy externally-hosted product images into Supabase Storage and
 * replaces products.image_path with the resulting Storage object path.
 *
 * Usage:
 *   node scripts/backfill-product-images-to-storage.mjs --dry-run
 *   node scripts/backfill-product-images-to-storage.mjs
 *   node scripts/backfill-product-images-to-storage.mjs --id <product-id> --source-url <replacement-image-url>
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator < 0 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, separator).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = line.slice(separator + 1).trim().replace(/^(?:"|')|(?:"|')$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
const BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
const dryRun = process.argv.includes("--dry-run");
const report = process.argv.includes("--report");
const idFlagIndex = process.argv.indexOf("--id");
const sourceUrlFlagIndex = process.argv.indexOf("--source-url");
const replacementProductId = idFlagIndex >= 0 ? String(process.argv[idFlagIndex + 1] || "").trim() : "";
const replacementSourceUrl = sourceUrlFlagIndex >= 0 ? String(process.argv[sourceUrlFlagIndex + 1] || "").trim() : "";
if (Boolean(replacementProductId) !== Boolean(replacementSourceUrl)) {
  throw new Error("--id and --source-url must be used together");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const { persistExternalProductImage } = await import("../server/services/product-image-storage.js");
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await client
  .from(TABLE)
  .select("id,brand,name,url,image_path,product_metadata")
  .ilike("image_path", "http%")
  .order("id");
if (error) throw error;

const products = Array.isArray(data) ? data : [];
if (report) {
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}
if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, externalImageCount: products.length }, null, 2));
  process.exit(0);
}

const result = { scanned: products.length, migrated: 0, failed: 0, failures: [] };

for (const product of products) {
  const id = String(product.id || "").trim();
  const sourcePath = String(product.image_path || "").trim();
  if (!id || !sourcePath) continue;

  let storagePath = "";
  try {
    const metadata = product.product_metadata && typeof product.product_metadata === "object" ? product.product_metadata : {};
    const fallbackCandidates = [
      ...(Array.isArray(metadata.image_candidates) ? metadata.image_candidates : []),
      ...(Array.isArray(metadata.tagging_image_urls) ? metadata.tagging_image_urls : []),
    ]
      .map((value) => String(value || "").trim())
      .filter((value) => /^https?:\/\//i.test(value) && value !== sourcePath);
    const replacementCandidate = id === replacementProductId ? replacementSourceUrl : "";
    const candidates = [replacementCandidate, sourcePath, ...new Set(fallbackCandidates)].filter(Boolean);
    let lastError = null;
    for (const candidate of candidates) {
      try {
        storagePath = await persistExternalProductImage(candidate);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!storagePath) throw lastError || new Error("product image could not be downloaded");
    const { data: updated, error: updateError } = await client
      .from(TABLE)
      .update({ image_path: storagePath })
      .eq("id", id)
      .eq("image_path", sourcePath)
      .select("id");
    if (updateError) throw updateError;
    if (!updated?.length) throw new Error("product image changed while migrating");
    result.migrated += 1;
  } catch (error) {
    if (storagePath) {
      const { error: cleanupError } = await client.storage.from(BUCKET).remove([storagePath]);
      if (cleanupError) console.error("[backfill-product-images] failed to remove orphaned upload", { id, storagePath });
    }
    result.failed += 1;
    result.failures.push({ id, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify(result, null, 2));
if (result.failed) process.exitCode = 1;
