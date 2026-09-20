/**
 * Finds conservative name-vs-AI attribute conflicts. Dry-run by default.
 * Use --apply only after the schema migration has been deployed.
 */
import { assertSupabaseConfig, supabase } from "../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../server/config/env.js";
import { detectStyleAttributeConflicts } from "../server/services/style-attribute-conflicts.js";

const apply = process.argv.includes("--apply");
assertSupabaseConfig();
const { data, error } = await supabase
  .from(SUPABASE_PRODUCTS_TABLE)
  .select("id,name,style_attributes,human_style_attributes,facts_reviewed_at")
  .order("id");
if (error) throw error;

const findings = (data || [])
  .map((product) => {
    const attributes =
      product.facts_reviewed_at && product.human_style_attributes
        ? product.human_style_attributes
        : product.style_attributes;
    return {
      id: product.id,
      conflicts: detectStyleAttributeConflicts(product, attributes),
    };
  })
  .filter((finding) => finding.conflicts.length);

if (apply) {
  for (const finding of findings) {
    const { error: updateError } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({
        style_attribute_conflicts: finding.conflicts,
        style_attribute_conflicts_detected_at: new Date().toISOString(),
        style_attribute_conflicts_reviewed_at: null,
      })
      .eq("id", finding.id);
    if (updateError) throw updateError;
  }
}
console.log(
  JSON.stringify(
    { apply, scanned: data?.length || 0, conflicts: findings.length, findings },
    null,
    2
  )
);
