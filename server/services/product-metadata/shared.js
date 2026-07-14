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
  { category: "outer", pattern: /(?:outer|coat|jacket|blazer|cardigan|padding|parka|windbreaker|bomber|anorak|vest|\uC544\uC6B0\uD130|\uCF54\uD2B8|\uC790\uCF13|\uBE14\uB808\uC774\uC800|\uAC00\uB514\uAC74|\uD328\uB529|\uD30C\uCE74|\uC810\uD37C|\uB9C8\uC774|\uBC14\uB78C\uB9C9\uC774|\uBCA0\uC2A4\uD2B8)/i },
  { category: "top", pattern: /(?:top|tee|t-shirt|shirt|knit|sweater|hoodie|sweatshirt|polo|longsleeve|long-sleeve|\uD0D1|\uD2F0\uC154\uCE20|\uC154\uCE20|\uB2C8\uD2B8|\uC2A4\uC6E8\uD130|\uD6C4\uB4DC|\uB9E8\uD22C\uB9E8|\uC2A4\uC6E8\uD2B8\uC154\uCE20|\uB871\uC2AC\uB9AC\uBE0C|\uBC18\uD314)/i },
  { category: "bottom", pattern: /(?:bottom|pants|trouser|jean|denim|slacks|skirt|shorts|cargo|\uD558\uC758|\uD32C\uCE20|\uBC14\uC9C0|\uCCAD\uBC14\uC9C0|\uB370\uB2D8|\uC2AC\uB799\uC2A4|\uC2A4\uCEE4\uD2B8|\uC204\uB354\uD32C\uCE20|\uB808\uAE45\uC2A4)/i },
  { category: "shoes", pattern: /(?:shoes|sneaker|loafer|boots?|heel|sandals?|moccasin|derby|\uC2E0\uBC1C|\uC6B4\uB3D9\uD654|\uC2A4\uB2C8\uCEE4\uC988|\uB85C\uD37C|\uBD80\uCE20|\uAD6C\uB450|\uC0CC\uB4E4|\uD790|\uBAA8\uCE74\uC2E0|\uB354\uBE44)/i },
  { category: "acc", pattern: /(?:accessor(?:y|ies)|\bacc\b|bag|belt|cap|hat|wallet|earring|necklace|bracelet|scarf|beanie|\uC561\uC138\uC11C\uB9AC|\uAC00\uBC29|\uBC31|\uD1A0\uD2B8|\uBAA8\uC790|\uBCF4\uB2DB|\uBCA8\uD2B8|\uC9C0\uAC11|\uADC0\uAC78\uC774|\uBAA9\uAC78\uC774|\uD314\uCC0C|\uC2A4\uCE74\uD504|\uC591\uB9D0)/i },
];

const CATEGORY_SOURCE_WEIGHTS = [8, 7, 6, 5, 3, 3, 1];

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
  const scores = new Map(ALLOWED_PRODUCT_CATEGORIES.map((category) => [category, 0]));
  for (let index = 0; index < texts.length; index += 1) {
    const text = normalizeCellText(texts[index]).toLowerCase();
    if (!text) continue;
    const weight = CATEGORY_SOURCE_WEIGHTS[index] || 1;
    for (const entry of PRODUCT_CATEGORY_PATTERNS) {
      if (entry.pattern.test(text)) {
        scores.set(entry.category, (scores.get(entry.category) || 0) + weight);
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [bestCategory, bestScore] = ranked[0] || ["", 0];
  const secondScore = ranked[1]?.[1] || 0;
  if (bestScore < 2 || bestScore === secondScore) return "";
  return bestCategory;
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
