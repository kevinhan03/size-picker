import { normalizeCellText, standardizeSizeTable } from "../utils/size-table.js";

const SIZE_TABLE_GEMINI_PROMPT_PRIMARY =
  "Analyze this clothing image and extract a size table when size information is visible. " +
  "Valid inputs include both grid tables and list-style blocks. " +
  "Normalize into JSON with `headers` and `rows` only. " +
  "Prefer a matrix where headers are [item, size1, size2, ...] and rows are measurement items. " +
  "Keep every cell as a plain string from the image, and do not invent missing values. " +
  "If no readable size information exists, return {\"headers\":[],\"rows\":[]}.";

const SIZE_TABLE_GEMINI_PROMPT_LIST_FALLBACK =
  "Extract apparel size info from this image even when it is not drawn as a table. " +
  "If the image contains per-size text blocks, convert them into a table JSON. " +
  "Return JSON only with `headers` and `rows`. " +
  "Use the first column as measurement name and remaining columns as sizes when possible. " +
  "Do not guess missing numbers. If nothing is readable, return empty arrays.";

export const SIZE_TABLE_GEMINI_PROMPT_CANDIDATES = [
  SIZE_TABLE_GEMINI_PROMPT_PRIMARY,
  SIZE_TABLE_GEMINI_PROMPT_LIST_FALLBACK,
];

export const SIZE_TABLE_GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["headers", "rows"],
  properties: {
    headers: { type: "ARRAY", items: { type: "STRING" } },
    rows: { type: "ARRAY", items: { type: "ARRAY", items: { type: "STRING" } } },
  },
};

export const SIZE_TABLE_GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
export const PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
export const PRODUCT_IMAGE_GEMINI_PROMPT =
  "Analyze this clothing product image candidate. Return JSON only. " +
  "Prioritize clothing-only images over model-wearing images.";
export const PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["hasVisiblePerson", "personArea", "frontViewScore", "productOnlyScore"],
  properties: {
    hasVisiblePerson: { type: "BOOLEAN" },
    personArea: { type: "STRING", enum: ["none", "small", "medium", "large"] },
    frontViewScore: { type: "NUMBER" },
    productOnlyScore: { type: "NUMBER" },
    reason: { type: "STRING" },
  },
};
export const PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT =
  "You are a fashion data analyst. Analyze the screenshot and extract product metadata. Return JSON only.";
export const PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["brand", "name", "category", "url", "image_path", "size_table"],
  properties: {
    brand: { type: "STRING" },
    name: { type: "STRING" },
    category: { type: "STRING" },
    url: { type: "STRING" },
    image_path: { type: "STRING" },
    product_image_bbox: {
      type: "OBJECT",
      properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" }, width: { type: "NUMBER" }, height: { type: "NUMBER" } },
    },
    size_chart_bbox: {
      type: "OBJECT",
      properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" }, width: { type: "NUMBER" }, height: { type: "NUMBER" } },
    },
    size_table: SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
  },
};

export const normalizeCaptureBoundingBox = (value) => {
  if (!value || typeof value !== "object") return null;
  const x = Math.max(0, Math.min(1000, Math.round(Number(value.x) || 0)));
  const y = Math.max(0, Math.min(1000, Math.round(Number(value.y) || 0)));
  const width = Math.max(0, Math.min(1000 - x, Math.round(Number(value.width) || 0)));
  const height = Math.max(0, Math.min(1000 - y, Math.round(Number(value.height) || 0)));
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
};

const normalizePersonAreaCategory = (value) => {
  const normalized = normalizeCellText(value).toLowerCase();
  if (normalized === "small" || normalized === "medium" || normalized === "large") return normalized;
  return "none";
};

export const normalizeProductImageGeminiAssessment = (value) => {
  if (!value || typeof value !== "object") return null;
  const hasVisiblePerson = value.hasVisiblePerson === true;
  const personArea = normalizePersonAreaCategory(value.personArea);
  const rawFrontViewScore = Number(value.frontViewScore);
  const frontViewScore = Number.isFinite(rawFrontViewScore)
    ? Math.max(0, Math.min(100, Math.round(rawFrontViewScore)))
    : 50;
  const rawScore = Number(value.productOnlyScore);
  const productOnlyScore = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : hasVisiblePerson ? 30 : 85;
  const reason = normalizeCellText(value.reason || "");
  return { hasVisiblePerson, personArea, frontViewScore, productOnlyScore, reason };
};

export { standardizeSizeTable };
