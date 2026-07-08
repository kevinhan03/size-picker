import { normalizeCellText } from "../../utils/size-table.js";
import { normalizeBrandName, uniqValues } from "./shared.js";

export const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

export const stripHtml = (value) =>
  decodeHtmlEntities(
    String(value || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

export const parseHtmlAttributes = (tag) => {
  const attributes = {};
  const attrPattern = /([A-Za-z_][A-Za-z0-9_:\-.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match = null;
  while ((match = attrPattern.exec(String(tag || ""))) !== null) {
    const key = String(match[1] || "").toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    attributes[key] = decodeHtmlEntities(value).trim();
  }
  return attributes;
};

export const extractHtmlTitle = (html) => {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeCellText(decodeHtmlEntities(match?.[1] || ""));
};

export const extractMetaContent = (html, key, attrName) => {
  const target = String(key || "").toLowerCase();
  const tagPattern = /<meta\s+[^>]*>/gi;
  let match = null;
  while ((match = tagPattern.exec(String(html || ""))) !== null) {
    const attrs = parseHtmlAttributes(match[0]);
    if (String(attrs[attrName] || "").toLowerCase() !== target) continue;
    if (attrs.content) return normalizeCellText(attrs.content);
  }
  return "";
};

export const extractJsonLdObjects = (html) => {
  const objects = [];
  const pattern = /<script[^>]+type=(?:"|')application\/ld\+json(?:"|')[^>]*>([\s\S]*?)<\/script>/gi;
  let match = null;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    const raw = String(match[1] || "").trim();
    if (!raw) continue;
    try {
      objects.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return objects;
};

const collectProductNodes = (node, output = []) => {
  if (!node) return output;
  if (Array.isArray(node)) {
    for (const item of node) collectProductNodes(item, output);
    return output;
  }
  if (typeof node !== "object") return output;

  const typeValue = node["@type"];
  const types = Array.isArray(typeValue) ? typeValue : [typeValue];
  const hasProductType = types.some((type) => String(type || "").toLowerCase() === "product");
  if (hasProductType) output.push(node);

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectProductNodes(value, output);
  }
  return output;
};

export const extractProductJsonLd = (html) => {
  const scripts = extractJsonLdObjects(html);
  const productNodes = [];
  for (const parsed of scripts) {
    collectProductNodes(parsed, productNodes);
  }
  if (productNodes.length === 0) return null;

  const bestNode = productNodes.find((node) => normalizeCellText(node?.name)) || productNodes[0];
  const brandNode = bestNode?.brand;
  const rawBrand =
    typeof brandNode === "string"
      ? brandNode
      : typeof brandNode === "object" && brandNode
        ? brandNode.name || brandNode.brand || ""
        : "";
  const rawImages = Array.isArray(bestNode?.image) ? bestNode.image : [bestNode?.image];
  return {
    name: normalizeCellText(bestNode?.name || ""),
    brand: normalizeBrandName(rawBrand),
    description: normalizeCellText(bestNode?.description || ""),
    category: normalizeCellText(bestNode?.category || ""),
    type: normalizeCellText(bestNode?.additionalType || bestNode?.["@type"] || ""),
    images: rawImages.map((value) => normalizeCellText(value)).filter(Boolean),
  };
};

export const extractNextDataPayload = (html) => {
  const match = String(html || "").match(
    /<script[^>]+id=(?:"|')__NEXT_DATA__(?:"|')[^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

export const extractMusinsaPageData = (nextDataPayload) => {
  const meta = nextDataPayload?.props?.pageProps?.meta?.data;
  if (!meta || typeof meta !== "object") return null;

  const resolveMusinsaImageUrl = (value) => {
    const raw = normalizeCellText(value);
    if (!raw) return "";
    if (raw.startsWith("/images/")) return `https://image.msscdn.net${raw}`;
    return raw;
  };

  const imageCandidates = [];
  if (meta.thumbnailImageUrl) imageCandidates.push(resolveMusinsaImageUrl(meta.thumbnailImageUrl));
  if (Array.isArray(meta.goodsImages)) {
    for (const item of meta.goodsImages) {
      const candidateUrl = resolveMusinsaImageUrl(item?.imageUrl || item?.url || "");
      if (candidateUrl) imageCandidates.push(candidateUrl);
    }
  }

  return {
    brand: normalizeBrandName(meta?.brandInfo?.brandName || meta?.brand || ""),
    name: normalizeCellText(meta?.goodsNm || ""),
    imageCandidates: uniqValues(imageCandidates),
    textBlocks: [meta?.goodsContents || "", meta?.specDesc || ""],
  };
};

export const extractJsonObjectsFromApplicationScripts = (html) => {
  const objects = [];
  const pattern = /<script[^>]+type=(?:"|')application\/json(?:"|')[^>]*>([\s\S]*?)<\/script>/gi;
  let match = null;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    const raw = String(match?.[1] || "").trim();
    if (!raw || raw.length > 2_000_000) continue;
    if (!(raw.startsWith("{") || raw.startsWith("["))) continue;
    try {
      objects.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return objects;
};

export const extractBrandFromDescription = (description) => {
  const brandMatch = String(description || "").match(/(?:brand|\uBE0C\uB79C\uB4DC)\s*[:\-]?\s*([^,|]+)/i);
  return normalizeBrandName(brandMatch?.[1] || "");
};

const TAGGING_TEXT_KEYWORDS =
  /(description|product|goods|detail|material|fabric|composition|care|fit|silhouette|color|colour|wash|washed|pocket|pleat|tuck|drawstring|waist|hem|denim|cotton|wool|nylon|polyester|corduroy|linen|leather|spandex|elastane|소재|혼용|상세|설명|상품|제품|핏|실루엣|와이드|스트레이트|테이퍼드|부츠컷|밴딩|스트링|포켓|카고|턱|주름|워싱|데님|면|울|나일론|코듀로이|컬러|색상)/i;

const normalizeTaggingTextBlock = (value) => {
  const normalized = stripHtml(value);
  if (normalized.length < 12) return "";
  if (normalized.length > 1200) return normalized.slice(0, 1200).trim();
  return normalized;
};

export const extractTaggingTextCandidatesFromHtml = ({ html, seedTexts = [] } = {}) => {
  const candidates = [];
  for (const text of seedTexts) {
    const normalized = normalizeTaggingTextBlock(text);
    if (normalized) candidates.push(normalized);
  }

  const source = String(html || "");
  const metaNames = [
    ["description", "name"],
    ["og:description", "property"],
    ["twitter:description", "name"],
    ["keywords", "name"],
  ];
  for (const [key, attrName] of metaNames) {
    const normalized = normalizeTaggingTextBlock(extractMetaContent(source, key, attrName));
    if (normalized) candidates.push(normalized);
  }

  const attrPattern =
    /<(?:section|article|div|p|li|span|td|th|dd|dt)[^>]*(?:class|id|data-[^=]+)=["'][^"']*(?:description|desc|detail|info|spec|material|fabric|fit|size|product|goods|prd|상품|상세|설명|소재|혼용|핏)[^"']*["'][^>]*>([\s\S]{0,5000}?)<\/(?:section|article|div|p|li|span|td|th|dd|dt)>/gi;
  let attrMatch = null;
  while ((attrMatch = attrPattern.exec(source)) !== null) {
    const normalized = normalizeTaggingTextBlock(attrMatch[1] || "");
    if (normalized && TAGGING_TEXT_KEYWORDS.test(normalized)) candidates.push(normalized);
  }

  const plainText = stripHtml(source);
  const sentences = plainText
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((value) => normalizeCellText(value))
    .filter((value) => value.length >= 18 && value.length <= 500 && TAGGING_TEXT_KEYWORDS.test(value));
  candidates.push(...sentences.slice(0, 60));

  return uniqValues(candidates).slice(0, 40);
};
