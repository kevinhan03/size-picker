import { AsyncLocalStorage } from "node:async_hooks";

export type ExecutionTrace = {
  model: string;
  version: string;
  events: Array<{ stage: string; data: unknown }>;
};
export const executionContext = new AsyncLocalStorage<ExecutionTrace>();
export function traceEvent(stage: string, data: unknown) {
  executionContext.getStore()?.events.push({ stage, data });
}
// Masks common contact/credential patterns in the admin projection, not stored conversation content.
export function redactText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[이메일]")
    .replace(/\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b/g, "[전화번호]")
    .replace(/\bsk-[a-z0-9_-]{12,}/gi, "[API 키]");
}
export function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redactValue(entry)])
    );
  return value;
}
