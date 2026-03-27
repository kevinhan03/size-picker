import { fetchWithTimeout } from "./url.js";

export const isZaraProductUrl = (urlValue) => {
  try {
    const hostname = new URL(String(urlValue || "")).hostname.replace(/^www\./, "").toLowerCase();
    return hostname === "zara.com";
  } catch {
    return false;
  }
};

const ZARA_STORE_IDS = {
  kr: 25009458, us: 11710, gb: 10701, jp: 12374,
  de: 13046, fr: 13047, es: 10702, it: 10703,
};

export const extractZaraMetadataFromInditexApi = async (
  pageUrl,
  {
    normalizeCellText = (value) => String(value || "").trim(),
    normalizeProductCategory = (value) => String(value || "").trim(),
  } = {}
) => {
  let referenceId = null;
  let countryCode = "kr";
  try {
    const parsed = new URL(String(pageUrl || ""));
    const pathMatch = parsed.pathname.match(/^\/([a-z]{2})\//);
    if (pathMatch) countryCode = pathMatch[1].toLowerCase();
    referenceId = parsed.searchParams.get("v1");
    if (!referenceId) {
      const fileMatch = parsed.pathname.match(/-p(\d+)\.html/i);
      if (fileMatch) referenceId = fileMatch[1];
    }
  } catch {
    return null;
  }
  if (!referenceId) return null;

  const storeId = ZARA_STORE_IDS[countryCode] || ZARA_STORE_IDS.kr;
  const apiUrl = `https://www.zara.com/itxrest/2/catalog/store/${storeId}/product/${referenceId}/detail`;

  try {
    const response = await fetchWithTimeout(apiUrl, {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        referer: "https://www.zara.com/",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data !== "object") return null;

    const name = normalizeCellText(data.name || "");
    if (!name) return null;

    const productImageCandidates = [];
    for (const color of data.colors || []) {
      for (const media of color.xmedia || []) {
        const url = media.url || (media.path && media.name ? `https://static.zara.net${media.path}/${media.name}` : "");
        if (url && /^https?:\/\//.test(url)) productImageCandidates.push(url);
      }
    }

    return {
      url: pageUrl,
      brand: "Zara",
      name,
      category: normalizeProductCategory(""),
      image_path: productImageCandidates[0] || "",
      productImage: null,
      productImageCandidates: productImageCandidates.slice(0, 24),
    };
  } catch {
    return null;
  }
};

export const isKreamProductUrl = (urlValue) => {
  try {
    const parsed = new URL(String(urlValue || "").trim());
    return String(parsed.hostname || "").toLowerCase().includes("kream.co.kr");
  } catch {
    return false;
  }
};
