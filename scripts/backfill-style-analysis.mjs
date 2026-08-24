/**
 * Rebuilds every product's AI taste analysis for the category-aware schema.
 * With --attributes-only it refreshes only AI facts and style axes. With
 * --axes-only it refreshes only AI style axes. Neither alters legacy tags or
 * alters legacy style tags or administrator overrides.
 *
 * Usage: node --env-file=.env scripts/backfill-style-analysis.mjs [--attributes-only|--axes-only] [--dry-run] [--ids 9,10] [--limit 20]
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
const axesOnly = process.argv.includes("--axes-only");
if (attributesOnly && axesOnly) throw new Error("use only one of --attributes-only or --axes-only");
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
const eligibleProducts = (attributesOnly || axesOnly)
  ? (data || []).filter((product) => CORE_TASTE_CATEGORIES.includes(product.category))
  : (data || []);
const requestedProducts = selectedIds.size
  ? eligibleProducts.filter((product) => selectedIds.has(String(product.id)))
  : eligibleProducts;
const products = limit ? requestedProducts.slice(0, limit) : requestedProducts;
const counts = { scanned: products.length, analyzed: 0, failed: 0, dryRun, attributesOnly, axesOnly };

for (const [index, product] of products.entries()) {
  const id = String(product.id);
  try {
    if (!dryRun) {
      const resetPayload = (attributesOnly || axesOnly)
        ? { style_axis_analysis_status: "tagging", style_axis_analysis_error: null }
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
      const result = await tagProductStyleById(id, { force: true, attributesOnly, axesOnly });
      if (!result?.ok) throw new Error(result?.error || "style analysis failed");
    }
    counts.analyzed += 1;
    console.log(`[${index + 1}/${products.length}] ${id}: ${dryRun ? "would analyze" : "analyzed"}${attributesOnly ? " attributes only" : axesOnly ? " axes only" : ""}`);
  } catch (analysisError) {
    counts.failed += 1;
    console.error(`[${index + 1}/${products.length}] ${id}: ${analysisError instanceof Error ? analysisError.message : String(analysisError)}`);
  }
}

console.log(JSON.stringify(counts, null, 2));
