/**
 * Classifies product presentation only when it is explicitly stated in product text.
 * It intentionally leaves ambiguous products as `unknown` instead of guessing from imagery.
 *
 * Usage:
 *   node scripts/backfill-product-target-gender.mjs --dry-run
 *   node scripts/backfill-product-target-gender.mjs
 *   node scripts/backfill-product-target-gender.mjs --force
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
    const raw = line.slice(separator + 1).trim();
    process.env[key] = raw.replace(/^(?:"|')|(?:"|')$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex >= 0 ? Math.max(0, Number(process.argv[limitIndex + 1] || 0)) : 0;

const PATTERNS = {
  unisex: /(?:\bunisex\b|gender[- ]?neutral|genderless|남녀\s*공용|유니섹스|젠더리스)/i,
  womenswear: /(?:\bwomen(?:'s|s)?\b|\bwomenswear\b|\bwoman\b|\bladies\b|\bfemale\b|여성|여자|우먼|레이디|숙녀)/i,
  menswear: /(?:\bmen(?:'s|s)?\b|\bmenswear\b|\bman\b|\bmale\b|남성|남자|맨즈|옴므)/i,
};

function productText(product) {
  const metadata = product?.product_metadata && typeof product.product_metadata === "object" ? product.product_metadata : {};
  const candidates = Array.isArray(metadata.tagging_text_candidates) ? metadata.tagging_text_candidates : [];
  return [product?.brand, product?.name, product?.url, ...candidates]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 12000);
}

function inferTargetGender(product) {
  const text = productText(product);
  if (PATTERNS.unisex.test(text)) return "unisex";
  const women = PATTERNS.womenswear.test(text);
  const men = PATTERNS.menswear.test(text);
  if (women && !men) return "womenswear";
  if (men && !women) return "menswear";
  return "unknown";
}

const { data, error } = await client.from(TABLE).select("id,brand,name,url,product_metadata,target_gender").order("id");
if (error) throw error;
const products = (data || []).filter((product) => force || !product.target_gender || product.target_gender === "unknown");
const target = limit ? products.slice(0, limit) : products;
const counts = { menswear: 0, womenswear: 0, unisex: 0, unknown: 0, updated: 0 };

for (const product of target) {
  const targetGender = inferTargetGender(product);
  counts[targetGender] += 1;
  if (targetGender === "unknown" || targetGender === product.target_gender) continue;
  if (!dryRun) {
    const { error: updateError } = await client.from(TABLE).update({ target_gender: targetGender }).eq("id", product.id);
    if (updateError) throw updateError;
  }
  counts.updated += 1;
}

console.log(JSON.stringify({ dryRun, scanned: target.length, ...counts }, null, 2));
