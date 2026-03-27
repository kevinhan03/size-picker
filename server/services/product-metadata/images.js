import { PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT } from "../../config/env.js";
import { normalizeCellText } from "../../utils/size-table.js";
import { escapeRegExp, uniqValues } from "./shared.js";
import { stripHtml, parseHtmlAttributes } from "./html.js";
import { normalizeUrlCandidate } from "./url.js";

export const SIZE_HINT_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|chart|guide|measurement|spec|\bcm\b)/i;
const IMAGE_KEY_HINT_PATTERN = /(?:image|img|photo|picture|thumbnail|thumb|zoom|src)/i;
const IMAGE_URL_PATTERN = /\.(?:png|jpe?g|webp|gif|bmp|svg)(?:[?#].*)?$/i;
const URL_VALUE_HINT_PATTERN = /^(?:https?:)?\/\/|^\/[^/]|^\.\.?\//i;
const HTML_PAGE_PATH_PATTERN = /\.(?:html?|php|aspx?|jsp)(?:[?#].*)?$/i;
const SIZE_CHART_PATH_HINT_PATTERN = /(?:size|chart|guide|measurement|spec|fit)/i;
const SIZE_CHART_IMAGE_REJECT_PATH_PATTERN =
  /(?:\/design\/skin\/|\/skin\/base\/|\/layout\/|\/common\/|\/btn\/|\/icon\/|\/sprite\/)/i;
const SIZE_CHART_IMAGE_REJECT_FILE_PATTERN =
  /(?:^|[\/_])(btn|txt|ico|icon|sprite|loading|loader|placeholder)(?:_|-|\.|$)/i;
const SIZE_CHART_IMAGE_REJECT_HOST_PATTERN = /(?:^|\.)img\.echosting\.cafe24\.com$/i;
const PRODUCT_IMAGE_TRACKING_HOST_PATTERN =
  /(?:^|\.)facebook\.com$|(?:^|\.)connect\.facebook\.net$|(?:^|\.)google-analytics\.com$|(?:^|\.)googletagmanager\.com$|(?:^|\.)doubleclick\.net$/i;
const PRODUCT_IMAGE_TRACKING_PATH_PATTERN = /(?:^|\/)(?:tr|collect|pixel|analytics)(?:\/|$)/i;
const PRODUCT_IMAGE_ALLOW_PATH_HINT_PATTERN =
  /(?:\/web\/product\/|\/goods_img\/|\/prd_img\/|\/product\/|\/images?\/|\/img\/|\/upload\/)/i;
const PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN =
  /(?:look|model|wear|coordi|campaign|editorial|style|outfit|fitview|snap)/i;
const PRODUCT_IMAGE_POSITIVE_HINT_PATTERN =
  /(?:product|goods|item|prd|main|front|cover|thumbnail|thumb|image|photo|zoom|large|big|\uC0C1\uD488|\uB300\uD45C|\uBA54\uC778)/i;
const PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN =
  /(?:logo|icon|banner|sprite|avatar|profile|review|event|lookbook|campaign|editorial|video|youtube|swatch|colorchip|watermark|model|detail-cut|detailcut|\uB85C\uACE0|\uC544\uC774\uCF58|\uBC30\uB108|\uB9AC\uBDF0|\uB8E9\uBD81|\uBAA8\uB378)/i;

const looksLikeUrlValue = (value) => {
  const text = normalizeCellText(value);
  if (!text || /\s/.test(text) || text.length > 1500) return false;
  if (URL_VALUE_HINT_PATTERN.test(text)) return true;
  if (HTML_PAGE_PATH_PATTERN.test(text)) return true;
  if (/^[A-Za-z0-9/_-]+(?:\?[^\s]*)?$/.test(text) && SIZE_CHART_PATH_HINT_PATTERN.test(text)) return true;
  return false;
};

export const isLikelySizeChartImageUrl = (url) => {
  const normalized = normalizeCellText(url).toLowerCase();
  if (!normalized) return false;
  let parsedUrl = null;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

  const pathname = String(parsedUrl.pathname || "").toLowerCase();
  const fileName = pathname.split("/").pop() || "";
  if (!IMAGE_URL_PATTERN.test(pathname) && !IMAGE_URL_PATTERN.test(normalized)) return false;
  if (SIZE_CHART_IMAGE_REJECT_HOST_PATTERN.test(parsedUrl.hostname)) return false;
  if (SIZE_CHART_IMAGE_REJECT_PATH_PATTERN.test(pathname)) return false;
  if (SIZE_CHART_IMAGE_REJECT_FILE_PATTERN.test(fileName)) return false;
  if (/\.gif(?:[?#].*)?$/.test(normalized)) return false;
  return true;
};

export const isLikelyProductImageUrl = (url) => {
  const normalized = normalizeCellText(url).toLowerCase();
  if (!normalized) return false;
  let parsedUrl = null;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

  const pathname = String(parsedUrl.pathname || "").toLowerCase();
  const fileName = pathname.split("/").pop() || "";
  const hostname = String(parsedUrl.hostname || "").toLowerCase();
  const queryText = String(parsedUrl.search || "").toLowerCase();
  const hintText = `${hostname} ${pathname} ${queryText}`;

  if (PRODUCT_IMAGE_TRACKING_HOST_PATTERN.test(hostname)) return false;
  if (PRODUCT_IMAGE_TRACKING_PATH_PATTERN.test(pathname)) return false;
  if (/(?:ev=pageview|noscript=1|gtm|fbq|pixel)/i.test(hintText)) return false;
  if (SIZE_CHART_IMAGE_REJECT_HOST_PATTERN.test(hostname)) return false;
  if (SIZE_CHART_IMAGE_REJECT_PATH_PATTERN.test(pathname)) return false;
  if (SIZE_CHART_IMAGE_REJECT_FILE_PATTERN.test(fileName)) return false;
  if (HTML_PAGE_PATH_PATTERN.test(pathname)) return false;

  if (IMAGE_URL_PATTERN.test(pathname) || IMAGE_URL_PATTERN.test(normalized)) return true;
  if (PRODUCT_IMAGE_ALLOW_PATH_HINT_PATTERN.test(pathname)) return true;
  return false;
};

const scoreSizeChartImageCandidate = (url) => {
  const normalized = normalizeCellText(url).toLowerCase();
  if (!normalized) return -1_000;

  let parsedUrl = null;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return -1_000;
  }

  const pathname = String(parsedUrl.pathname || "").toLowerCase();
  const fileName = pathname.split("/").pop() || "";
  const hintText = `${pathname} ${parsedUrl.search}`.toLowerCase();

  let score = 0;
  if (SIZE_HINT_PATTERN.test(hintText) || SIZE_CHART_PATH_HINT_PATTERN.test(hintText)) score += 12;
  if (/\/web\/product\/extra\/big\//i.test(pathname)) score += 11;
  else if (/\/web\/product\/extra\//i.test(pathname)) score += 8;
  if (/\/web\/product\/extra\/small\//i.test(pathname)) score -= 2;
  if (/\/product\//i.test(pathname)) score += 4;
  if (/[a-f0-9]{16,}\.(?:png|jpe?g|webp)$/i.test(fileName)) score += 2;
  if (/\.gif(?:[?#].*)?$/.test(normalized)) score -= 30;
  if (SIZE_CHART_IMAGE_REJECT_HOST_PATTERN.test(parsedUrl.hostname)) score -= 100;
  if (SIZE_CHART_IMAGE_REJECT_PATH_PATTERN.test(pathname)) score -= 100;
  if (SIZE_CHART_IMAGE_REJECT_FILE_PATTERN.test(fileName)) score -= 100;
  return score;
};

export const sortSizeChartImageCandidates = (candidates) =>
  uniqValues(candidates).sort(
    (left, right) => scoreSizeChartImageCandidate(right) - scoreSizeChartImageCandidate(left)
  );

export const scoreProductImageCandidate = (url, hintText = "") => {
  const normalized = normalizeCellText(url).toLowerCase();
  if (!normalized) return -1_000;

  let parsedUrl = null;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return -1_000;
  }

  const pathname = String(parsedUrl.pathname || "").toLowerCase();
  const fileName = pathname.split("/").pop() || "";
  const hint = `${normalizeCellText(hintText).toLowerCase()} ${pathname} ${parsedUrl.search}`.trim();

  let score = 0;
  if (PRODUCT_IMAGE_POSITIVE_HINT_PATTERN.test(hint)) score += 9;
  if (/\/(product|goods|item|prd)\//i.test(pathname)) score += 7;
  if (/\/web\/product\/medium\//i.test(pathname)) score -= 6;
  if (/(?:^|[_\-/.])(main|front|cover|represent|thumb0?1)(?:[_\-/.]|$)/i.test(fileName)) score += 8;
  if (/(?:big|large|zoom|origin|original|xlarge)/i.test(hint)) score += 3;
  if (/(?:^|[_\-/.])(front|main|cover|represent)(?:[_\-/.]|$)/i.test(hint)) score += 5;
  if (/(?:product[-_\\s]?only|flat|laid[-\\s]?flat|packshot|still[-\\s]?life)/i.test(hint)) score += 14;
  if (/\/web\/product\/big\//i.test(pathname)) score += 7;
  if (/\/web\/product\/small\//i.test(pathname)) score -= 4;
  if (/\/web\/product\/extra\/big\//i.test(pathname)) score -= 16;
  else if (/\/product\/extra\//i.test(pathname)) score -= 12;
  if (/\/goods_img\//i.test(pathname)) score += 6;
  if (/\/prd_img\//i.test(pathname)) score -= 2;
  if (/\/web\/upload\/category\//i.test(pathname)) score -= 20;
  if (/\/category\/editor\//i.test(pathname)) score -= 12;
  if (/(?:^|[_\-/.])menu(?:[_\-/.]|$)/i.test(fileName)) score -= 18;
  if (/(?:^|[_\-/.])(logo|banner|gnb|lnb)(?:[_\-/.]|$)/i.test(fileName)) score -= 14;
  if (/(?:^|[_\-/.])(detail|sub|model|look|coordi|back|rear|side)(?:[_\-/.]|$)/i.test(fileName)) {
    score -= 18;
  }
  if (PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname)) score -= 30;

  if (PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN.test(hint)) score -= 18;
  if (/(?:person|human|wearing|李⑹슜|紐⑤뜽|猷⑸턿|lookbook|outfit|styling|coordi)/i.test(hint)) score -= 24;
  if (/(?:back|rear|side|profile)/i.test(hint)) score -= 14;
  if (SIZE_HINT_PATTERN.test(hint) || SIZE_CHART_PATH_HINT_PATTERN.test(hint)) score -= 28;
  if (SIZE_CHART_IMAGE_REJECT_HOST_PATTERN.test(parsedUrl.hostname)) score -= 80;
  if (SIZE_CHART_IMAGE_REJECT_PATH_PATTERN.test(pathname)) score -= 80;
  if (SIZE_CHART_IMAGE_REJECT_FILE_PATTERN.test(fileName)) score -= 80;
  if (/\.gif(?:[?#].*)?$/.test(normalized)) score -= 25;
  if (/\.svg(?:[?#].*)?$/.test(normalized)) score -= 20;
  if (!IMAGE_URL_PATTERN.test(pathname) && !IMAGE_URL_PATTERN.test(normalized)) score -= 2;

  const widthParam = Number(
    parsedUrl.searchParams.get("w") || parsedUrl.searchParams.get("width") || parsedUrl.searchParams.get("img_w") || 0
  );
  const heightParam = Number(
    parsedUrl.searchParams.get("h") || parsedUrl.searchParams.get("height") || parsedUrl.searchParams.get("img_h") || 0
  );
  if (Number.isFinite(widthParam) && widthParam > 0 && widthParam < 220) score -= 10;
  if (Number.isFinite(heightParam) && heightParam > 0 && heightParam < 220) score -= 8;
  if (Number.isFinite(widthParam) && widthParam >= 600) score += 2;
  if (Number.isFinite(heightParam) && heightParam >= 600) score += 2;

  return score;
};

export const sortProductImageCandidates = (candidates, hintText = "", sourceBonusByUrl = null) => {
  const scored = uniqValues(candidates).map((candidate) => ({
    url: candidate,
    score: scoreProductImageCandidate(candidate, hintText) + Number(sourceBonusByUrl?.get(candidate) || 0),
  }));
  return scored.sort((left, right) => right.score - left.score).map((entry) => entry.url);
};

export const isModelLikeProductImageCandidate = (url, hintText = "") => {
  const normalized = normalizeCellText(url).toLowerCase();
  if (!normalized) return false;

  let parsedUrl = null;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return false;
  }

  const pathname = String(parsedUrl.pathname || "").toLowerCase();
  const fileName = pathname.split("/").pop() || "";
  const hint = `${normalizeCellText(hintText).toLowerCase()} ${pathname} ${parsedUrl.search}`.trim();

  if (PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname)) return true;
  if (/(?:^|[_\-/.])(model|look|coordi|back|rear|side)(?:[_\-/.]|$)/i.test(fileName)) return true;
  if (PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN.test(hint)) return true;
  return /(?:person|human|wearing|lookbook|outfit|styling|coordi|李⑹슜|紐⑤뜽|猷⑸턿)/i.test(hint);
};

export const isStrongProductOnlyProductImageCandidate = (url, hintText = "") => {
  if (isModelLikeProductImageCandidate(url, hintText)) return false;
  const score = scoreProductImageCandidate(url, hintText);
  if (score < 20) return false;

  try {
    const parsedUrl = new URL(String(url || ""));
    const pathname = String(parsedUrl.pathname || "").toLowerCase();
    return (
      /\/web\/product\/(?:big|medium)\//i.test(pathname) ||
      /\/goods_img\//i.test(pathname) ||
      /(?:^|[_\-/.])(main|front|cover|represent|thumb0?1)(?:[_\-/.]|$)/i.test(pathname) ||
      /(?:product[-_\s]?only|flat|laid[-\s]?flat|packshot|still[-\s]?life)/i.test(pathname)
    );
  } catch {
    return false;
  }
};

const isGalleryExtraProductImageCandidate = (url) => {
  try {
    const pathname = String(new URL(String(url || "")).pathname || "").toLowerCase();
    return /\/web\/product\/extra\//i.test(pathname);
  } catch {
    return false;
  }
};

const buildProductImageGeminiShortlist = (candidateUrls, hintText = "") => {
  const normalizedCandidates = uniqValues(candidateUrls).filter(Boolean);
  const scanLimit = Math.max(
    4,
    Math.min(normalizedCandidates.length, Number(PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT) || 12)
  );
  const galleryExtraCandidates = normalizedCandidates.filter((candidate) =>
    isGalleryExtraProductImageCandidate(candidate)
  );
  const nonMediumCandidates = normalizedCandidates.filter((candidate) => {
    try {
      const pathname = String(new URL(String(candidate || "")).pathname || "").toLowerCase();
      return !/\/web\/product\/medium\//i.test(pathname);
    } catch {
      return true;
    }
  });
  const sampledCandidates = uniqValues([
    ...galleryExtraCandidates,
    ...nonMediumCandidates,
    ...normalizedCandidates,
  ]);
  const scannedCandidates = sampledCandidates.slice(0, scanLimit);
  const nonModelCandidates = scannedCandidates.filter(
    (candidate) => !isModelLikeProductImageCandidate(candidate, hintText)
  );
  const modelCandidates = scannedCandidates.filter((candidate) =>
    isModelLikeProductImageCandidate(candidate, hintText)
  );
  const strongNonModelCandidates = nonModelCandidates.filter((candidate) =>
    isStrongProductOnlyProductImageCandidate(candidate, hintText)
  );

  return uniqValues([
    ...galleryExtraCandidates,
    normalizedCandidates[0] || "",
    ...strongNonModelCandidates,
    ...nonModelCandidates,
    ...modelCandidates.slice(0, nonModelCandidates.length > 0 ? 1 : 2),
  ]).filter(Boolean);
};

export const shouldSkipGeminiImageRerank = (candidateUrls, hintText = "") => {
  const normalizedCandidates = uniqValues(candidateUrls).filter(Boolean);
  if (normalizedCandidates.length <= 1) return true;
  if (normalizedCandidates.some((candidate) => isGalleryExtraProductImageCandidate(candidate))) {
    return false;
  }

  const topCandidate = normalizedCandidates[0];
  const secondCandidate = normalizedCandidates[1] || "";
  const topScore = scoreProductImageCandidate(topCandidate, hintText);
  const secondScore = secondCandidate ? scoreProductImageCandidate(secondCandidate, hintText) : -1_000;

  return (
    isStrongProductOnlyProductImageCandidate(topCandidate, hintText) &&
    !isModelLikeProductImageCandidate(topCandidate, hintText) &&
    topScore >= 24 &&
    topScore - secondScore >= 8
  );
};

export const addImageResolutionVariants = (candidates) => {
  const expanded = [];
  for (const candidate of uniqValues(candidates)) {
    if (!candidate) continue;
    expanded.push(candidate);
    try {
      const parsed = new URL(candidate);
      const pathname = String(parsed.pathname || "");
      if (/\/web\/product\/extra\/small\//i.test(pathname)) {
        expanded.push(candidate.replace(/\/web\/product\/extra\/small\//i, "/web/product/extra/big/"));
      }
      if (/\/web\/product\/small\//i.test(pathname)) {
        expanded.push(candidate.replace(/\/web\/product\/small\//i, "/web/product/big/"));
      }
    } catch {
      continue;
    }
  }
  return uniqValues(expanded);
};

export const buildProductImageRankingSeed = (candidateUrls, hintText = "") =>
  buildProductImageGeminiShortlist(candidateUrls, hintText);

export const extractProductNameFromTitle = (title, brand) => {
  const firstChunk = normalizeCellText(String(title || "").split("|")[0]);
  if (!firstChunk) return "";
  const withoutSuffix = normalizeCellText(firstChunk.split(" - ")[0]);
  if (!withoutSuffix) return "";
  if (!brand) return withoutSuffix;

  const pattern = new RegExp(`^${escapeRegExp(brand)}(?:\\s*\\([^)]*\\))?\\s*`, "i");
  return normalizeCellText(withoutSuffix.replace(pattern, ""));
};

export const extractProductImageCandidatesFromHtml = ({ html, pageUrl }) => {
  const tagPattern = /<img\b[^>]*>/gi;
  const bestScoreByUrl = new Map();
  let match = null;

  while ((match = tagPattern.exec(String(html || ""))) !== null) {
    const attrs = parseHtmlAttributes(match[0]);
    const rawSrcSet = String(attrs.srcset || attrs["data-srcset"] || "").trim();
    const srcSetUrls = rawSrcSet
      ? rawSrcSet
          .split(",")
          .map((entry) => entry.trim().split(/\s+/)[0] || "")
          .filter(Boolean)
      : [];

    const rawCandidates = [
      attrs["data-zoom-image"],
      attrs["data-large-image"],
      attrs["data-origin"],
      attrs["data-original"],
      attrs["data-src"],
      attrs["data-lazy-src"],
      attrs["data-lazy"],
      attrs.src,
      ...srcSetUrls,
    ].filter(Boolean);

    const hintText = [
      attrs.alt || "",
      attrs.title || "",
      attrs.class || "",
      attrs.id || "",
      attrs["data-name"] || "",
      attrs["data-index"] || "",
    ]
      .join(" ")
      .trim();

    for (const rawCandidate of rawCandidates) {
      const resolvedUrl = normalizeUrlCandidate(pageUrl, rawCandidate);
      if (!resolvedUrl) continue;

      const score = scoreProductImageCandidate(resolvedUrl, hintText);
      const prevScore = bestScoreByUrl.get(resolvedUrl);
      if (!Number.isFinite(prevScore) || score > prevScore) {
        bestScoreByUrl.set(resolvedUrl, score);
      }
    }
  }

  return [...bestScoreByUrl.entries()]
    .filter(([, score]) => score > -80)
    .sort((left, right) => right[1] - left[1])
    .map(([url]) => url);
};

export const extractImageCandidatesFromHtml = ({ html, pageUrl, priorityPattern }) => {
  const tagPattern = /<img\b[^>]*>/gi;
  const scored = [];
  let match = null;
  while ((match = tagPattern.exec(String(html || ""))) !== null) {
    const attrs = parseHtmlAttributes(match[0]);
    const rawSrcSet = String(attrs.srcset || attrs["data-srcset"] || "").trim();
    const srcSetFirst = rawSrcSet ? rawSrcSet.split(",")[0].trim().split(/\s+/)[0] : "";
    const rawUrl =
      attrs["data-zoom-image"] ||
      attrs["data-large-image"] ||
      attrs.src ||
      attrs["data-src"] ||
      attrs["data-original"] ||
      attrs["data-lazy-src"] ||
      attrs["data-lazy"] ||
      srcSetFirst ||
      "";
    const resolvedUrl = normalizeUrlCandidate(pageUrl, rawUrl);
    if (!resolvedUrl) continue;

    const hint = `${attrs.alt || ""} ${attrs.class || ""} ${attrs.id || ""} ${resolvedUrl}`.toLowerCase();
    let score = 0;
    if (priorityPattern?.test(hint)) score += 6;
    if (/(product|goods|detail|prd|item|big|large|photo|image)/.test(hint)) score += 2;
    if (/(logo|icon|banner|sprite|avatar|ogp)/.test(hint)) score -= 6;
    scored.push({ url: resolvedUrl, score });
  }
  return uniqValues(scored.sort((left, right) => right.score - left.score).map((item) => item.url));
};

export const extractImageCandidatesFromJsonData = ({ jsonData, pageUrl }) => {
  const productCandidates = [];
  const sizeChartCandidates = [];
  const stack = [{ node: jsonData, keyHint: "" }];
  let visited = 0;

  while (stack.length > 0 && visited < 5000) {
    const { node, keyHint } = stack.pop();
    visited += 1;

    if (typeof node === "string") {
      const raw = normalizeCellText(node);
      const hasImageKeyHint = IMAGE_KEY_HINT_PATTERN.test(keyHint);
      const looksLikeImageUrl = IMAGE_URL_PATTERN.test(raw);
      if (!hasImageKeyHint && !looksLikeImageUrl) continue;

      const resolved = normalizeUrlCandidate(pageUrl, raw);
      if (!resolved) continue;
      productCandidates.push(resolved);
      if (SIZE_HINT_PATTERN.test(`${keyHint} ${resolved}`)) {
        sizeChartCandidates.push(resolved);
      }
      continue;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push({ node: item, keyHint });
      }
      continue;
    }
    if (!node || typeof node !== "object") continue;

    for (const [key, value] of Object.entries(node)) {
      const nextHint = `${keyHint} ${String(key || "")}`.trim();
      stack.push({ node: value, keyHint: nextHint });
    }
  }

  return {
    productCandidates: uniqValues(productCandidates),
    sizeChartCandidates: uniqValues(sizeChartCandidates),
  };
};

export const extractSizeChartPageCandidatesFromJsonData = ({ jsonData, pageUrl }) => {
  const candidates = [];
  const stack = [{ node: jsonData, keyHint: "" }];
  let visited = 0;

  while (stack.length > 0 && visited < 5000) {
    const { node, keyHint } = stack.pop();
    visited += 1;

    if (typeof node === "string") {
      const raw = normalizeCellText(node);
      if (!looksLikeUrlValue(raw)) continue;

      const hintText = `${keyHint} ${raw}`;
      if (!SIZE_HINT_PATTERN.test(hintText) && !SIZE_CHART_PATH_HINT_PATTERN.test(raw)) continue;

      const resolved = normalizeUrlCandidate(pageUrl, raw);
      if (!resolved || IMAGE_URL_PATTERN.test(resolved)) continue;
      candidates.push(resolved);
      continue;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push({ node: item, keyHint });
      }
      continue;
    }
    if (!node || typeof node !== "object") continue;

    for (const [key, value] of Object.entries(node)) {
      const nextHint = `${keyHint} ${String(key || "")}`.trim();
      stack.push({ node: value, keyHint: nextHint });
    }
  }

  return uniqValues(candidates);
};

export const extractSizeChartPageCandidatesFromHtml = ({ html, pageUrl }) => {
  const candidates = [];

  const anchorPattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch = null;
  while ((anchorMatch = anchorPattern.exec(String(html || ""))) !== null) {
    const attrs = parseHtmlAttributes(anchorMatch[0]);
    const rawUrl = attrs.href || attrs["data-href"] || attrs["data-url"] || "";
    if (!looksLikeUrlValue(rawUrl)) continue;

    const resolved = normalizeUrlCandidate(pageUrl, rawUrl);
    if (!resolved || IMAGE_URL_PATTERN.test(resolved)) continue;

    const hint = [
      attrs.class || "",
      attrs.id || "",
      attrs.title || "",
      attrs["aria-label"] || "",
      stripHtml(anchorMatch[1] || ""),
      resolved,
    ]
      .join(" ")
      .trim();

    if (SIZE_HINT_PATTERN.test(hint) || SIZE_CHART_PATH_HINT_PATTERN.test(resolved)) {
      candidates.push(resolved);
    }
  }

  return uniqValues(candidates);
};
