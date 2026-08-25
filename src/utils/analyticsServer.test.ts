import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsProperties } from "../../server/lib/analytics";

describe("analytics property sanitization", () => {
  it("keeps scalar product analytics properties and removes direct identifiers", () => {
    expect(sanitizeAnalyticsProperties({ product_id: "p-1", result_count: 3, logged_in: true, email: "person@example.com", search_query: "coat" })).toEqual({
      product_id: "p-1", result_count: 3, logged_in: true,
    });
  });
});
