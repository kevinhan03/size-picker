import { createHash } from "node:crypto";
import type { Product, StyleAxes } from "../../../src/types";
import { STYLE_AXIS_FIELDS } from "../../../src/constants/styleAnalysis.js";
import { getEffectiveStyleAxes } from "../../../src/utils/styleProfile";

export const VERSION = "eight-axis-k2-v1";
const keys = STYLE_AXIS_FIELDS.map((f) => f.key) as (keyof StyleAxes)[];
export type Cluster = {
  centroid: StyleAxes;
  memberIds: string[];
  representativeIds: string[];
  categories: Record<string, number>;
  spread: number;
  description: string;
};
export const distance = (a: StyleAxes, b: StyleAxes) =>
  Math.sqrt(
    keys.reduce((sum, key) => sum + (a[key] - b[key]) ** 2, 0) / keys.length
  );
export const similarity = (a: StyleAxes, b: StyleAxes) =>
  Math.max(0, 1 - distance(a, b) / 6);
export function inputs(products: Product[]) {
  return [...new Map(products.map((p) => [p.id, p])).values()]
    .flatMap((p) => {
      const effective = getEffectiveStyleAxes(p);
      return effective
        ? [{ id: p.id, category: p.category, axes: effective.axes }]
        : [];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
export function fingerprint(products: Product[]) {
  return createHash("sha256")
    .update(JSON.stringify({ version: VERSION, products: inputs(products) }))
    .digest("hex");
}
export function buildClusters(products: Product[]): {
  accepted: boolean;
  reason: string;
  clusters: Cluster[];
  count: number;
  separation: number;
} {
  const points = inputs(products);
  const reject = (reason: string) => ({
    accepted: false,
    reason,
    clusters: [],
    count: points.length,
    separation: 0,
  });
  if (points.length < 8) return reject("insufficient_inputs");
  // Deterministic farthest-pair initialization; no random labels across runs.
  let pair = [0, 1],
    farthest = 0;
  points.forEach((a, i) =>
    points.forEach((b, j) => {
      const d = distance(a.axes, b.axes);
      if (d > farthest) {
        farthest = d;
        pair = [i, j];
      }
    })
  );
  let centers = pair.map((i) => points[i].axes);
  let groups: (typeof points)[] = [[], []];
  for (let iteration = 0; iteration < 50; iteration++) {
    groups = [[], []];
    points.forEach((p) =>
      groups[
        distance(p.axes, centers[0]) <= distance(p.axes, centers[1]) ? 0 : 1
      ].push(p)
    );
    if (groups.some((g) => !g.length)) return reject("collapsed");
    const next = groups.map(
      (g) =>
        Object.fromEntries(
          keys.map((key) => [
            key,
            g.reduce((sum, p) => sum + p.axes[key], 0) / g.length,
          ])
        ) as StyleAxes
    );
    const shift = Math.max(...next.map((c, i) => distance(c, centers[i])));
    centers = next;
    if (shift < 1e-6) break;
  }
  if (groups.some((g) => g.length < 3 || g.length / points.length > 0.85))
    return reject("imbalanced");
  const separation = distance(centers[0], centers[1]);
  const clusters = groups.map((g, index) => {
    const centroid = centers[index];
    const spread =
      g.reduce((sum, p) => sum + distance(p.axes, centroid), 0) / g.length;
    const distinctive = [...keys]
      .sort((a, b) => Math.abs(centroid[b] - 4) - Math.abs(centroid[a] - 4))
      .slice(0, 2);
    return {
      centroid,
      memberIds: g.map((p) => p.id),
      representativeIds: [...g]
        .sort(
          (a, b) =>
            distance(a.axes, centroid) - distance(b.axes, centroid) ||
            a.id.localeCompare(b.id)
        )
        .slice(0, 3)
        .map((p) => p.id),
      categories: g.reduce(
        (counts, p) => {
          counts[p.category] = (counts[p.category] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      ),
      spread,
      description: distinctive
        .map((key) => `${key}: ${centroid[key].toFixed(1)}/7`)
        .join(" · "),
    };
  });
  if (
    separation < 1 ||
    separation < 1.5 * Math.max(...clusters.map((c) => c.spread))
  )
    return reject("weak_separation");
  return {
    accepted: true,
    reason: "passed",
    clusters,
    count: points.length,
    separation,
  };
}
