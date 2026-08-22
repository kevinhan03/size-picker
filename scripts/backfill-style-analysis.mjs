/**
 * Rebuilds every product's AI taste analysis for the category-aware schema.
 * By default it clears superseded manual style overrides. With --attributes-only,
 * it preserves AI and manual style tags/evidence and refreshes only detailed
 * style attributes, while preserving all tag, evidence, and gender values.
 *
 * Usage: node --env-file=.env scripts/backfill-style-analysis.mjs [--attributes-only] [--dry-run] [--ids 9,10] [--limit 20]
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(fileName) {
  const file = resolve(process.cwd(), fileName);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator < 0 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, separator).trim();
    if (key && !process.env[key]) process.env[key] = line.slice(separator + 1).trim().replace(/^(?:"|')|(?:"|')$/g, "");
  }
}

loadEnv(".env.local");
loadEnv(".env");
const dryRun = process.argv.includes("--dry-run");
const attributesOnly = process.argv.includes("--attributes-only");
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex >= 0 ? Math.max(0, Number(process.argv[limitIndex + 1] || 0)) : 0;
const idsIndex = process.argv.indexOf("--ids");
const selectedIds = new Set((idsIndex >= 0 ? String(process.argv[idsIndex + 1] || "") : "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean));

const { SUPABASE_PRODUCTS_TABLE } = await import("../server/config/env.js");
const { assertSupabaseConfig, supabase } = await import("../server/lib/supabase.js");
const { tagProductStyleById } = await import("../server/services/style-tagging.js");
const { CORE_TASTE_CATEGORIES } = await import("../src/constants/styleAnalysis.js");
assertSupabaseConfig();
const { data, error } = await supabase.from(SUPABASE_PRODUCTS_TABLE).select("id,category").order("id");
if (error) throw error;
const eligibleProducts = attributesOnly
  ? (data || []).filter((product) => CORE_TASTE_CATEGORIES.includes(product.category))
  : (data || []);
const requestedProducts = selectedIds.size
  ? eligibleProducts.filter((product) => selectedIds.has(String(product.id)))
  : eligibleProducts;
const products = limit ? requestedProducts.slice(0, limit) : requestedProducts;
const counts = { scanned: products.length, analyzed: 0, failed: 0, dryRun, attributesOnly };

for (const [index, product] of products.entries()) {
  const id = String(product.id);
  try {
    if (!dryRun) {
      const resetPayload = attributesOnly
        ? {
            human_style_attributes: null,
            tag_review_status: "needs_review",
            tag_review_note: null,
            reviewed_by: null,
            reviewed_at: null,
          }
        : {
            human_style_tags: null,
            human_style_attributes: null,
            human_style_tags_evidence: null,
            tag_review_status: "needs_review",
            tag_review_note: null,
            reviewed_by: null,
            reviewed_at: null,
          };
      const { error: resetError } = await supabase.from(SUPABASE_PRODUCTS_TABLE).update(resetPayload).eq("id", id);
      if (resetError) throw resetError;
      await tagProductStyleById(id, { force: true, attributesOnly });
    }
    counts.analyzed += 1;
    console.log(`[${index + 1}/${products.length}] ${id}: ${dryRun ? "would analyze" : "analyzed"}${attributesOnly ? " attributes only" : ""}`);
  } catch (analysisError) {
    counts.failed += 1;
    console.error(`[${index + 1}/${products.length}] ${id}: ${analysisError instanceof Error ? analysisError.message : String(analysisError)}`);
  }
}

console.log(JSON.stringify(counts, null, 2));
