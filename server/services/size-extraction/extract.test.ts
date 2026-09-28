import { describe, expect, it } from "vitest";
import { emptyResult, readPage, validateTable } from "./extract.mjs";
import { normalizeExtractionUrl, publicUrl } from "./network.mjs";

describe("size extraction", () => {
  it("prefers a valid embedded size table", () => {
    const page = readPage(
      `<script type="application/json">{"sizes":[{"size":"S","shoulder":"45","chest":"52"},{"size":"M","shoulder":"47","chest":"55"}]}</script>`,
      "https://shop.example.com/products/shirt"
    );

    expect(page.result).toMatchObject({
      status: "found",
      source: "embedded_json",
      table: { headers: ["사이즈", "S", "M"] },
    });
  });

  it("does not accept body, inch, or millimeter charts", () => {
    const page = readPage(
      `<table><tr><th>size</th><th>S</th><th>M</th></tr><tr><td>chest</td><td>90</td><td>95</td></tr></table><p>Body measurements · inches</p>`,
      "https://shop.example.com/products/shirt"
    );

    expect(page.result).toEqual(emptyResult("not_found", "ambiguous_measurements"));
  });

  it("requires rectangular, bounded table data", () => {
    expect(validateTable({ headers: ["size", "S"], rows: [["chest"]] })).toBeNull();
  });

  it("rejects internal URLs and removes only tracking parameters", () => {
    expect(() => publicUrl("http://127.0.0.1/admin")).toThrow("Unsafe URL");
    expect(normalizeExtractionUrl("https://shop.example.com/p/1?utm_source=x&size=M")).toBe(
      "https://shop.example.com/p/1?size=M"
    );
  });
});
