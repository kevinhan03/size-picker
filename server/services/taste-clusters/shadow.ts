import type { Product, StyleAxes } from "../../../src/types";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { getEffectiveStyleAxes } from "../../../src/utils/styleProfile";
import { similarity, type Cluster } from "./cluster";

// Diagnostic only: same candidate pool, taste component only. Never mutates live ranking.
export function compareTaste(
  clusters: Cluster[],
  products: Product[],
  plan: AgentPlan,
  baselineIds: string[],
  mean?: StyleAxes
) {
  const preferences = (plan.session?.axisPreferences || []).filter(
    (p) =>
      clusters.length &&
      p.key in clusters[0].centroid &&
      Number.isFinite(p.target) &&
      p.target >= 1 &&
      p.target <= 7
  );
  const selectedCluster = preferences.length
    ? (clusters
        .map((c, index) => ({
          index,
          error: preferences.reduce(
            (sum, p) =>
              sum + (c.centroid[p.key as keyof StyleAxes] - p.target) ** 2,
            0
          ),
        }))
        .sort((a, b) => a.error - b.error || a.index - b.index)[0]?.index ??
      null)
    : null;
  const ranked = products
    .flatMap((product) => {
      const effective = getEffectiveStyleAxes(product);
      if (!effective || !clusters.length) return [];
      const scores = clusters.map((c) =>
        similarity(effective.axes, c.centroid)
      );
      const score =
        selectedCluster === null
          ? Math.max(...scores)
          : scores[selectedCluster];
      return [
        {
          id: product.id,
          score,
          meanScore: mean ? similarity(effective.axes, mean) : null,
        },
      ];
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const shadowIds = ranked.slice(0, 5).map((p) => p.id);
  const baseline = baselineIds.slice(0, 5);
  const meanIds = mean
    ? [...ranked]
        .sort((a, b) => b.meanScore! - a.meanScore! || a.id.localeCompare(b.id))
        .slice(0, 5)
        .map((p) => p.id)
    : [];
  return {
    selectedCluster,
    shadowIds,
    meanIds,
    scores: ranked,
    baselineIds: baseline,
    overlap: baseline.length
      ? shadowIds.filter((id) => baseline.includes(id)).length / baseline.length
      : 0,
  };
}
