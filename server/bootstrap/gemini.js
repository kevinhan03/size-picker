import {
  GEMINI_API_BASE,
  GEMINI_API_KEY,
  PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK,
} from "../config/env.js";
import { createGeminiService } from "../services/gemini.js";
import { createImageDownloadService } from "../services/product-metadata/image-download.js";
import { createProductImageRankingService } from "../services/product-metadata/image-ranking.js";
import { normalizeProductCategory } from "../services/product-metadata/shared.js";
import { assertPublicHttpUrl, fetchWithTimeout } from "../services/product-metadata/url.js";
import { normalizeCellText, standardizeSizeTable } from "../utils/size-table.js";

const SIZE_TABLE_GEMINI_PROMPT_PRIMARY =
  "Analyze this clothing image and extract a size table when size information is visible. " +
  "Valid inputs include both grid tables and list-style blocks (for example: M: total length 62cm, shoulder 57cm, chest 60cm). " +
  "Normalize into JSON with `headers` and `rows` only. " +
  "Prefer a matrix where headers are [measurement, size1, size2, ...] and rows are measurement items. " +
  "Keep every cell as a plain string from the image, and do not invent missing values. " +
  "If no readable size information exists, return {\"headers\":[],\"rows\":[]}.";

const SIZE_TABLE_GEMINI_PROMPT_LIST_FALLBACK =
  "Extract apparel size info from this image even when it is not drawn as a table. " +
  "If the image contains per-size text blocks (M/L/XL sections with measurements), convert them into a table JSON. " +
  "Return JSON only with `headers` and `rows`. " +
  "Use the first column as measurement name and remaining columns as sizes when possible. " +
  "Do not guess missing numbers. If nothing is readable, return empty arrays.";

const SIZE_TABLE_GEMINI_PROMPT_CANDIDATES = [
  SIZE_TABLE_GEMINI_PROMPT_PRIMARY,
  SIZE_TABLE_GEMINI_PROMPT_LIST_FALLBACK,
];

const SIZE_TABLE_GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["headers", "rows"],
  properties: {
    headers: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    rows: {
      type: "ARRAY",
      items: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
  },
};

const SIZE_TABLE_GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const PRODUCT_IMAGE_GEMINI_PROMPT =
  "Analyze this clothing product image candidate. " +
  "Return JSON only. " +
  "Rank using this priority order: 1) clothing-only image with no real person, 2) front-facing clothing view, 3) any other clothing-only view, 4) mannequin image, 5) model-wearing image. " +
  "Focus on whether the image is a product-only shot or a model-wearing shot, and whether the clothing front side is visible as the main view. " +
  "A mannequin is NOT a human model. " +
  "If one or more real people are visible, hasVisiblePerson must be true. " +
  "Estimate visible person area as one of: none, small, medium, large. " +
  "Output frontViewScore from 0 to 100 where higher means the garment front side is clearly shown as the main view. " +
  "Also output productOnlyScore from 0 to 100 where higher means better for product-only thumbnail selection under that priority order.";

const PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["hasVisiblePerson", "personArea", "frontViewScore", "productOnlyScore"],
  properties: {
    hasVisiblePerson: { type: "BOOLEAN" },
    personArea: {
      type: "STRING",
      enum: ["none", "small", "medium", "large"],
    },
    frontViewScore: { type: "NUMBER" },
    productOnlyScore: { type: "NUMBER" },
    reason: { type: "STRING" },
  },
};

const PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT =
  "You are a fashion data analyst. " +
  "Analyze the provided screenshot image and extract product metadata. " +
  "Return JSON only. " +
  "Fields: brand, name, category, url, image_path, size_table, product_image_bbox, size_chart_bbox. " +
  "category must be exactly one of: outer, top, bottom, shoes, acc. " +
  "If unknown, return an empty string for that field. " +
  "Find the official product page URL when visible or inferable from the screenshot. " +
  "Find the main product image URL for image_path when visible. " +
  "For size_table, return an object with headers and rows; if unreadable, return empty arrays. " +
  "For product_image_bbox and size_chart_bbox, return normalized integer coordinates from 0 to 1000 relative to the full screenshot using x, y, width, height. " +
  "If a region is not visible, return width: 0 and height: 0.";

const PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA = {
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
      properties: {
        x: { type: "NUMBER" },
        y: { type: "NUMBER" },
        width: { type: "NUMBER" },
        height: { type: "NUMBER" },
      },
    },
    size_chart_bbox: {
      type: "OBJECT",
      properties: {
        x: { type: "NUMBER" },
        y: { type: "NUMBER" },
        width: { type: "NUMBER" },
        height: { type: "NUMBER" },
      },
    },
    size_table: {
      type: "OBJECT",
      required: ["headers", "rows"],
      properties: {
        headers: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
        rows: {
          type: "ARRAY",
          items: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
      },
    },
  },
};

const normalizeCaptureBoundingBox = (value) => {
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
  if (normalized === "none") return "none";
  if (normalized === "small") return "small";
  if (normalized === "medium") return "medium";
  if (normalized === "large") return "large";
  return "none";
};

const normalizeProductImageGeminiAssessment = (value) => {
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
    : hasVisiblePerson
      ? 30
      : 85;
  const reason = normalizeCellText(value.reason || "");
  return {
    hasVisiblePerson,
    personArea,
    frontViewScore,
    productOnlyScore,
    reason,
  };
};

export function createGeminiStack() {
  const geminiService = createGeminiService({
    assertPublicHttpUrl,
    GEMINI_API_BASE,
    GEMINI_API_KEY,
    normalizeCaptureBoundingBox,
    normalizeCellText,
    normalizeProductCategory,
    PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT,
    PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA,
    PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK,
    PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES,
    PRODUCT_IMAGE_GEMINI_PROMPT,
    PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA,
    SIZE_TABLE_GEMINI_MODEL_CANDIDATES,
    SIZE_TABLE_GEMINI_PROMPT_CANDIDATES,
    SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
    standardizeSizeTable,
    normalizeProductImageGeminiAssessment,
  });

  const imageDownloadService = createImageDownloadService({
    assessProductImageWithGemini: geminiService.assessProductImageWithGemini,
    assertPublicHttpUrl,
    fetchWithTimeout,
    GEMINI_API_KEY,
  });

  const imageRankingService = createProductImageRankingService({
    assessProductImageWithGemini: geminiService.assessProductImageWithGemini,
    downloadImageAsBase64Payload: imageDownloadService.downloadImageAsBase64Payload,
    selectTopUsableImageUrls: imageDownloadService.selectTopUsableImageUrls,
  });

  return {
    ...geminiService,
    ...imageDownloadService,
    prioritizeProductImageCandidates: imageRankingService.prioritizeProductImageCandidates,
  };
}
