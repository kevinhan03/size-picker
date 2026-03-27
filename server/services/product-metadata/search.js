import { normalizeCellText } from "../../utils/size-table.js";
import { uniqValues } from "./shared.js";
import { assertPublicHttpUrl, normalizeUrlCandidate } from "./url.js";

const PRODUCT_PAGE_SEARCH_REJECT_HOST_PATTERN =
  /(?:^|\.)google\.[a-z.]+$|(?:^|\.)bing\.com$|(?:^|\.)duckduckgo\.com$|(?:^|\.)youtube\.com$|(?:^|\.)instagram\.com$|(?:^|\.)facebook\.com$|(?:^|\.)x\.com$|(?:^|\.)twitter\.com$|(?:^|\.)blog\.naver\.com$|(?:^|\.)post\.naver\.com$/i;
const PRODUCT_PAGE_SEARCH_POSITIVE_PATH_PATTERN =
  /(?:product|goods|item|shop|catalog|detail|products|brand|store|mall|musinsa|wconcept|29cm|ssfshop|eql|hago)/i;
const PRODUCT_PAGE_SEARCH_NEGATIVE_PATH_PATTERN =
  /(?:search|login|signup|account|cart|order|category|list|ranking|best|event|lookbook|review|community)/i;

const decodeSearchResultRedirectUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
    return parsed.toString();
  } catch {
    return raw;
  }
};

export const extractSearchResultUrls = (html, baseUrl) => {
  const urls = [];
  const anchorPattern = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))[^>]*>/gi;
  let match = null;
  while ((match = anchorPattern.exec(String(html || ""))) !== null) {
    const href = match[2] || match[3] || match[4] || "";
    let candidate = normalizeUrlCandidate(baseUrl, href);
    if (!candidate) continue;
    candidate = decodeSearchResultRedirectUrl(candidate);
    try {
      candidate = assertPublicHttpUrl(candidate);
    } catch {
      continue;
    }
    urls.push(candidate);
  }
  return uniqValues(urls);
};

export const scoreProductPageSearchCandidate = (urlValue, { brand = "", name = "" } = {}) => {
  let parsed = null;
  try {
    parsed = new URL(String(urlValue || "").trim());
  } catch {
    return -1_000;
  }

  const hostname = String(parsed.hostname || "").toLowerCase();
  const pathText = `${parsed.hostname} ${parsed.pathname} ${parsed.search}`.toLowerCase();
  if (PRODUCT_PAGE_SEARCH_REJECT_HOST_PATTERN.test(hostname)) return -1_000;

  const hints = normalizeCellText(`${brand} ${name}`).toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;
  if (PRODUCT_PAGE_SEARCH_POSITIVE_PATH_PATTERN.test(pathText)) score += 8;
  if (PRODUCT_PAGE_SEARCH_NEGATIVE_PATH_PATTERN.test(pathText)) score -= 12;
  if (/\/products?\//i.test(parsed.pathname)) score += 8;
  if (/\/goods\//i.test(parsed.pathname)) score += 8;
  if (/\/items?\//i.test(parsed.pathname)) score += 6;
  if (/\/product\/detail/i.test(parsed.pathname)) score += 6;
  if (/[\?&](?:goodsNo|product_no|productno|itemid|no|id)=/i.test(parsed.search)) score += 5;
  for (const hint of hints) {
    if (hint.length < 2) continue;
    if (pathText.includes(hint)) score += 2;
  }
  return score;
};

export const buildProductSearchQueries = ({ brand = "", name = "", category = "" }) => {
  const normalizedBrand = normalizeCellText(brand);
  const normalizedName = normalizeCellText(name);
  const normalizedCategory = normalizeCellText(category);
  const compactName = normalizedName.replace(/[()[\]{}]/g, " ").replace(/\s+/g, " ").trim();
  return uniqValues([
    `${normalizedBrand} ${compactName}`.trim(),
    `${normalizedBrand} ${compactName} official`.trim(),
    `${normalizedBrand} ${compactName} ${normalizedCategory}`.trim(),
  ]).filter((value) => value.split(/\s+/).length >= 2);
};
