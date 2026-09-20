import type { Product, StyleAxes } from "../../../src/types";
import { STYLE_AXIS_FIELDS } from "../../../src/constants/styleAnalysis.js";
import { getEffectiveStyleAxes } from "../../../src/utils/styleProfile";

const AXES = STYLE_AXIS_FIELDS.map((field) => field.key) as Array<
  keyof StyleAxes
>;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type TasteConfidence = {
  totalCount: number;
  analyzedCount: number;
  analyzableRatio: number;
  axisConsistency: number;
  categoryCount: number;
  categoryCoverage: number;
  confidence: number;
  level: "none" | "low" | "medium" | "high";
};

/**
 * A conservative confidence estimate for the existing mean-axis taste model.
 * Category coverage is diagnostic only: a focused collection can still be a
 * reliable expression of taste and should not be penalized for specialization.
 */
export function computeTasteConfidence(products: Product[]): TasteConfidence {
  const analyzed = products
    .map((product) => ({
      product,
      axes: getEffectiveStyleAxes(product)?.axes,
    }))
    .filter((entry): entry is { product: Product; axes: StyleAxes } =>
      Boolean(entry.axes)
    );
  const totalCount = products.length;
  const analyzedCount = analyzed.length;
  const analyzableRatio = totalCount ? analyzedCount / totalCount : 0;
  const categoryCount = new Set(
    products.map((product) => product.category).filter(Boolean)
  ).size;
  const categoryCoverage = Math.min(1, categoryCount / 4);

  let axisConsistency = 0;
  if (analyzedCount === 1) axisConsistency = 0.35;
  if (analyzedCount >= 2) {
    const meanDeviation =
      AXES.reduce((axisSum, key) => {
        const mean =
          analyzed.reduce((sum, entry) => sum + entry.axes[key], 0) /
          analyzedCount;
        const variance =
          analyzed.reduce(
            (sum, entry) => sum + (entry.axes[key] - mean) ** 2,
            0
          ) / analyzedCount;
        return axisSum + Math.sqrt(variance) / 3;
      }, 0) / AXES.length;
    axisConsistency = clamp(1 - meanDeviation);
  }

  const countEvidence = Math.min(1, analyzedCount / 12);
  const confidence =
    analyzedCount === 0
      ? 0
      : clamp(
          0.55 * countEvidence + 0.25 * analyzableRatio + 0.2 * axisConsistency
        );
  const level =
    confidence === 0
      ? "none"
      : confidence < 0.4
        ? "low"
        : confidence < 0.7
          ? "medium"
          : "high";

  return {
    totalCount,
    analyzedCount,
    analyzableRatio,
    axisConsistency,
    categoryCount,
    categoryCoverage,
    confidence,
    level,
  };
}
