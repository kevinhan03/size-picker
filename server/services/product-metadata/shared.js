import { normalizeCellText } from "../../utils/size-table.js";

export const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeBrandName = (value) =>
  normalizeCellText(value)
    .replace(/\s*?⑤씪??s*?ㅽ넗??s*怨듭떇紐?/i, "")
    .replace(/\s*?⑤씪??s*怨듭떇紐?/i, "")
    .replace(/\s*怨듭떇\s*?ㅽ넗??/i, "")
    .replace(/\s*official\s+online\s+store$/i, "")
    .replace(/\s*official\s+store$/i, "")
    .trim();

const ALLOWED_PRODUCT_CATEGORIES = ["outer", "top", "bottom", "shoes", "acc"];
const PRODUCT_CATEGORY_PATTERNS = [
  { category: "outer", pattern: /(?:outer|coat|jacket|blazer|cardigan|padding|parka|windbreaker)/i },
  { category: "top", pattern: /(?:top|tee|t-shirt|shirt|knit|sweater|hoodie|sweatshirt)/i },
  { category: "bottom", pattern: /(?:bottom|pants|trouser|jean|denim|slacks|skirt|shorts)/i },
  { category: "shoes", pattern: /(?:shoes|sneaker|loafer|boots?|heel|sandals?)/i },
  { category: "acc", pattern: /(?:acc|accessory|bag|belt|cap|hat|wallet|earring|necklace|bracelet|scarf)/i },
];

export const normalizeProductCategory = (value) => {
  const normalized = normalizeCellText(value).toLowerCase();
  if (!normalized) return "";
  if (ALLOWED_PRODUCT_CATEGORIES.includes(normalized)) return normalized;
  for (const entry of PRODUCT_CATEGORY_PATTERNS) {
    if (entry.pattern.test(normalized)) return entry.category;
  }
  return "";
};

export const inferProductCategory = (...texts) => {
  for (const text of texts) {
    const inferred = normalizeProductCategory(text);
    if (inferred) return inferred;
  }
  return "";
};

export const pickFirstNonEmpty = (values) => {
  for (const value of values) {
    const normalized = normalizeCellText(value);
    if (normalized) return normalized;
  }
  return "";
};

export const uniqValues = (values) => {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const normalized = normalizeCellText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
};
