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

  it("extracts nested size records returned by commerce APIs", () => {
    const page = readPage(
      "",
      "https://shop.example.com/products/shirt",
      [{
        data: {
          sizes: [
            { name: "M", items: [{ name: "총장", value: 68 }, { name: "가슴단면", value: 56 }, { name: "소매길이", value: 60 }, { name: "소매부리단면", value: 0 }] },
            { name: "L", items: [{ name: "총장", value: 70 }, { name: "가슴단면", value: 58 }, { name: "소매길이", value: 62 }, { name: "소매부리단면", value: 0 }] },
          ],
        },
      }]
    );

    expect(page.result).toMatchObject({
      status: "found",
      source: "site_api",
      table: {
        headers: ["사이즈", "M", "L"],
        rows: [["총장", "68", "70"], ["가슴", "56", "58"], ["소매", "60", "62"]],
      },
    });
  });

  it("extracts metric values from doubly nested size API measurements", () => {
    const page = readPage(
      "",
      "https://shop.example.com/products/jacket",
      [{
        result: [{
          sizeChart: [
            { name: "S", displayCode: "003", sizeParts: [{ name: "전체 길이", measurements: [{ value: "64", unit: "cm" }, { value: "25 1/4", unit: "inch" }] }, { name: "가슴너비", measurements: [{ value: "58", unit: "cm" }, { value: "22 3/4", unit: "inch" }] }] },
            { name: "M", displayCode: "004", sizeParts: [{ name: "전체 길이", measurements: [{ value: "66", unit: "cm" }, { value: "26", unit: "inch" }] }, { name: "가슴너비", measurements: [{ value: "61", unit: "cm" }, { value: "24", unit: "inch" }] }] },
            { name: "L", displayCode: "005", sizeParts: [{ name: "전체 길이", measurements: [{ value: "68", unit: "cm" }, { value: "26 3/4", unit: "inch" }] }, { name: "가슴너비", measurements: [{ value: "64", unit: "cm" }, { value: "25 1/4", unit: "inch" }] }] },
          ],
        }],
      }]
    );

    expect(page.result).toMatchObject({
      status: "found",
      source: "site_api",
      table: {
        headers: ["사이즈", "S", "M", "L"],
        rows: [["총장", "64", "66", "68"], ["가슴", "58", "61", "64"]],
      },
    });
  });

  it("keeps a verified site API table when the page also mentions body measurements", () => {
    const page = readPage(
      "<p>신체 치수 · inches</p>",
      "https://shop.example.com/products/jacket",
      [{ sizes: [{ name: "S", items: [{ name: "총장", value: 64 }, { name: "가슴", value: 58 }] }, { name: "M", items: [{ name: "총장", value: 66 }, { name: "가슴", value: 61 }] }] }]
    );

    expect(page.result).toMatchObject({ status: "found", source: "site_api" });
  });

  it("does not accept body, inch, or millimeter charts", () => {
    const page = readPage(
      `<table><tr><th>size</th><th>S</th><th>M</th></tr><tr><td>chest</td><td>90</td><td>95</td></tr></table><p>Body measurements · inches</p>`,
      "https://shop.example.com/products/shirt"
    );

    expect(page.result).toEqual(emptyResult("not_found", "ambiguous_measurements"));
  });

  it("normalizes row-oriented charts and ignores product detail tables", () => {
    const page = readPage(
      `<table><tr><th>size</th><th>Cut-off Raglan L/S T-shirt</th></tr><tr><td>price</td><td>88000</td></tr><tr><td>material</td><td>Cotton 100%</td></tr></table>
       <div class="size-guide"><table><thead><tr><th>SIZE</th><th>LENGTH</th><th>CHEST</th><th>SLEEVES</th></tr></thead><tbody>
       <tr><td>XS</td><td>66</td><td>54</td><td>72.5</td></tr><tr><td>S</td><td>69</td><td>56.5</td><td>74.5</td></tr>
       <tr><td>M</td><td>70</td><td>59</td><td>75.5</td></tr><tr><td>L</td><td>71</td><td>61.5</td><td>76.5</td></tr>
       </tbody></table></div>`,
      "https://shop.example.com/products/shirt"
    );

    expect(page.result).toMatchObject({
      status: "found",
      source: "dom_table",
      table: {
        headers: ["사이즈", "XS", "S", "M", "L"],
        rows: [
          ["총장", "66", "69", "70", "71"],
          ["가슴", "54", "56.5", "59", "61.5"],
          ["소매", "72.5", "74.5", "75.5", "76.5"],
        ],
      },
    });
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
