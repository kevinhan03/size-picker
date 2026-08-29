import { describe, expect, it } from "vitest";
import { buildStyleFeature } from "./style-cluster-scoring.js";

const axes = { formality: 1, refinement: 2, technicality: 3, historical_orientation: 4, visual_boldness: 5, affective_softness: 6, unconventionality: 7, sensuality: 4 };
const model = { pca_mean: [0, 0], pca_components: [[1, 0], [0, 1]], feature_config: { fact_vocabulary: [], axis_keys: Object.keys(axes) } };

describe("style cluster feature", () => {
  it("uses reviewed axes over AI axes and returns a normalized weighted vector", () => {
    const feature = buildStyleFeature({ category: "Top", image_embedding: [1, 0], style_axes: { ...axes, formality: 5 }, human_style_axes: axes, tag_review_status: "approved", style_attributes: {} }, model);
    expect(feature).not.toBeNull();
    expect(Math.hypot(...feature!)).toBeCloseTo(1, 8);
    // The reviewed formality (1) makes the first axis direction negative.
    expect(feature![2]).toBeLessThan(0);
  });

  it("excludes non-core categories and products without style inputs", () => {
    expect(buildStyleFeature({ category: "Accessory", image_embedding: [1, 0], style_axes: axes }, model)).toBeNull();
    expect(buildStyleFeature({ category: "Top", image_embedding: [], style_axes: axes }, model)).toBeNull();
  });

  it("rejects legacy models and incomplete eight-axis vectors", () => {
    expect(buildStyleFeature({ category: "Top", image_embedding: [1, 0], style_axes: axes }, { ...model, feature_config: { fact_vocabulary: [] } })).toBeNull();
    expect(buildStyleFeature({ category: "Top", image_embedding: [1, 0], style_axes: { ...axes, sensuality: 8 } }, model)).toBeNull();
  });
});
