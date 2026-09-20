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
  it("does not react to one-off feedback", () => {
    const liked = product("1", 6);
    const profile = summarizeFeedback(
      [{ product_id: "1", sentiment: "positive", reason: null }],
      [liked]
    );
    expect(feedbackAdjustment(liked, profile)).toBe(0);
  });

  it("waits for repeated feedback, then applies a bounded style preference", () => {
    const liked = product("1", 6),
      disliked = product("2", 1);
    const profile = summarizeFeedback(
      [
        { product_id: "1", sentiment: "positive", reason: null },
        { product_id: "2", sentiment: "negative", reason: "not_my_taste" },
        { product_id: "1", sentiment: "positive", reason: null },
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

  it("does not treat a condition miss as negative taste evidence", () => {
    const liked = product("1", 6);
    const profile = summarizeFeedback(
      [
        { product_id: "1", sentiment: "negative", reason: "wrong_condition" },
        { product_id: "1", sentiment: "negative", reason: "wrong_condition" },
        { product_id: "1", sentiment: "negative", reason: "wrong_condition" },
      ],
      [liked]
    );
    expect(profile.negativeAxes).toEqual({});
    expect(profile.actionableTotal).toBe(0);
    expect(feedbackAdjustment(liked, profile)).toBe(0);
  });

  it("uses repeated similarity feedback as a novelty signal", () => {
    const candidate = product("1", 4);
    const profile = summarizeFeedback(
      [
        { product_id: "1", sentiment: "negative", reason: "too_similar" },
        { product_id: "1", sentiment: "negative", reason: "too_similar" },
        { product_id: "1", sentiment: "negative", reason: "too_similar" },
      ],
      [candidate]
    );
    expect(feedbackAdjustment(candidate, profile, 0.9)).toBeGreaterThan(
      feedbackAdjustment(candidate, profile, 0.1)
    );
  });
});
