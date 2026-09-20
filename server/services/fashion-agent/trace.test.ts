import { expect, it } from "vitest";
import {
  executionContext,
  traceEvent,
  redactValue,
  type ExecutionTrace,
} from "./trace";

it("keeps concurrent users' traces isolated across async work", async () => {
  const a: ExecutionTrace = { model: "test", version: "v1", events: [] };
  const b: ExecutionTrace = { model: "test", version: "v1", events: [] };
  await Promise.all([
    executionContext.run(a, async () => {
      await Promise.resolve();
      traceEvent("intent", "alice");
    }),
    executionContext.run(b, async () => {
      traceEvent("intent", "bob");
      await Promise.resolve();
      traceEvent("ranking", "bob");
    }),
  ]);
  expect(a.events).toEqual([{ stage: "intent", data: "alice" }]);
  expect(b.events).toHaveLength(2);
  expect(b.events.every((event) => event.data === "bob")).toBe(true);
});
it("masks contact and token text recursively without modifying the stored answer", () => {
  const original = {
    question: "test@example.com 010-1234-5678",
    nested: ["sk-abcdefghijklmnop"],
  };
  expect(redactValue(original)).toEqual({
    question: "[이메일] [전화번호]",
    nested: ["[API 키]"],
  });
  expect(original.question).toContain("test@example.com");
});
