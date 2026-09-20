import { describe, expect, it } from "vitest";
import type { Product, StyleAxes } from "../../../src/types";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { buildClusters, fingerprint } from "./cluster";
import { compareTaste } from "./shadow";

const axes = (value: number): StyleAxes => ({
  formality: value,
  refinement: value,
  technicality: value,
  historical_orientation: value,
  visual_boldness: value,
  affective_softness: value,
  unconventionality: value,
  sensuality: value,
});
const product = (id: number, value: number) =>
  ({ id: String(id), category: "Top", styleAxes: axes(value) }) as Product;
const points = [
  ...Array.from({ length: 4 }, (_, i) => product(i, 2)),
  ...Array.from({ length: 4 }, (_, i) => product(i + 4, 6)),
];
describe("taste cluster quality gates", () => {
  it("separates modes with representative products", () => {
    const result = buildClusters(points);
    expect(result.accepted).toBe(true);
    expect(result.clusters.map((c) => c.memberIds.length)).toEqual([4, 4]);
    expect(result.clusters.every((c) => c.representativeIds.length === 3)).toBe(
      true
    );
  });
  it("is deterministic across input ordering and deduplication", () => {
    expect(buildClusters([...points].reverse())).toEqual(buildClusters(points));
    expect(fingerprint([...points, points[0]])).toBe(fingerprint(points));
  });
  it("rejects insufficient and homogeneous inputs", () => {
    expect(buildClusters(points.slice(0, 7)).reason).toBe(
      "insufficient_inputs"
    );
    expect(
      buildClusters(points.map((p) => ({ ...p, styleAxes: axes(4) }))).reason
    ).toBe("collapsed");
  });
  it("rejects an outlier posing as a second taste", () => {
    expect(
      buildClusters([
        ...points.slice(0, 4),
        product(8, 2),
        product(9, 2),
        product(10, 2),
        product(11, 7),
      ]).reason
    ).toBe("imbalanced");
  });
  it("does not silently impute missing axes", () => {
    expect(
      buildClusters([...points.slice(0, 7), { ...points[7], styleAxes: null }])
        .accepted
    ).toBe(false);
  });
  it("fingerprints axis changes", () => {
    expect(fingerprint(points)).not.toBe(
      fingerprint([...points.slice(0, 7), product(7, 5)])
    );
  });
  it("uses session-selected cluster without mutating production results", () => {
    const before = JSON.stringify(points);
    const baseline = points.slice(0, 5).map((p) => p.id);
    const plan = {
      session: { axisPreferences: [{ key: "formality", target: 7 }] },
    } as AgentPlan;
    const result = compareTaste(
      buildClusters(points).clusters,
      points,
      plan,
      baseline
    );
    expect(result.selectedCluster).toBe(1);
    expect(result.shadowIds[0]).toBe("4");
    expect(result.baselineIds).toEqual(baseline);
    expect(JSON.stringify(points)).toBe(before);
  });
  it("uses closest cluster, not average centroid, without session cues", () => {
    const result = compareTaste(
      buildClusters(points).clusters,
      [...points, product(9, 4)],
      {} as AgentPlan,
      []
    );
    expect(result.selectedCluster).toBeNull();
    expect(result.shadowIds).not.toContain("9");
  });
});
