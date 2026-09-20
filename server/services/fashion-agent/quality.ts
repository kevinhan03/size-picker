import type { Product } from "../../../src/types";
import { STYLE_ATTRIBUTE_FIELDS } from "../../../src/constants/styleAnalysis.js";
import { getEffectiveStyleAxes } from "../../../src/utils/styleProfile";

/** Read-only audit of normalized products; denominators respect category applicability. */
export function auditProducts(products: Product[]) {
  return {
    total: products.length,
    withAxes: products.filter((p) => getEffectiveStyleAxes(p)).length,
    humanReviewedFacts: products.filter(
      (p) => p.factsReviewedAt && p.humanStyleAttributes
    ).length,
    fields: [...new Set(STYLE_ATTRIBUTE_FIELDS.map((f) => f.key))].map(
      (key) => {
        const applicable = products.filter((p) =>
          STYLE_ATTRIBUTE_FIELDS.some(
            (f) => f.key === key && f.categories.includes(p.category)
          )
        );
        const valid = applicable.filter((p) => {
          const facts =
            p.factsReviewedAt && p.humanStyleAttributes
              ? p.humanStyleAttributes
              : p.styleAttributes;
          const fields = STYLE_ATTRIBUTE_FIELDS.filter(
            (f) => f.key === key && f.categories.includes(p.category)
          );
          const values = facts?.[key];
          if (values === undefined || values === null) return false;
          const list = Array.isArray(values) ? values : [values];
          return (
            list.length > 0 &&
            list.every((value) =>
              fields.some((f) =>
                f.options.some((o: { value: string }) => o.value === value)
              )
            )
          );
        });
        return {
          key,
          applicable: applicable.length,
          valid: valid.length,
          missingOrInvalid: applicable.length - valid.length,
        };
      }
    ),
  };
}
