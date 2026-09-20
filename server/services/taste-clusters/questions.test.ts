import { expect, it } from "vitest";
import { evaluationQuestions } from "./questions";
it("provides fifty unique, executable fixed evaluation questions", () => {
  expect(evaluationQuestions).toHaveLength(50);
  expect(new Set(evaluationQuestions.map((item) => item.id)).size).toBe(50);
  expect(
    evaluationQuestions.every(
      (item) =>
        item.plan.personalized &&
        item.plan.intent === "recommend" &&
        item.plan.unsupported.length === 0
    )
  ).toBe(true);
});
