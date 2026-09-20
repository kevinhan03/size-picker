import { describe, expect, it } from "vitest";
import {
  emptyFeedbackProfile,
  feedbackAdjustment,
  summarizeFeedback,
} from "./feedback";

const product = (id: string, formality: number) =>
  ({
    id,
    brand: "B",
    name: id,
    image: "",
    url: "",
    category: "Top",
    styleAxes: {
      formality,
      refinement: 4,
      technicality: 4,
      historical_orientation: 4,
      visual_boldness: 4,
      affective_softness: 4,
      unconventionality: 4,
      sensuality: 4,
    },
  }) as never;

describe("feedback reranking", () => {
  it("gives a bounded preference to a style the user explicitly liked", () => {
    const liked = product("1", 6),
      disliked = product("2", 1);
    const profile = summarizeFeedback(
      [
        { product_id: "1", sentiment: "positive", reason: null },
        { product_id: "2", sentiment: "negative", reason: "not_my_taste" },
      ],
      [liked, disliked]
    );
    expect(feedbackAdjustment(liked, profile)).toBeGreaterThan(0);
    expect(feedbackAdjustment(disliked, profile)).toBeLessThan(0);
    expect(Math.abs(feedbackAdjustment(liked, profile))).toBeLessThanOrEqual(
      0.12
    );
    expect(feedbackAdjustment(liked, emptyFeedbackProfile())).toBe(0);
  });
});
