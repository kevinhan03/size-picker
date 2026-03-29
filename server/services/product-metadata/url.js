import { PRODUCT_METADATA_FETCH_TIMEOUT_MS } from "../../config/env.js";
import { decodeHtmlEntities } from "./html.js";

const isPrivateIPv4Host = (hostname) => {
  const parts = String(hostname || "")
    .split(".")
    .map((part) => Number(part));
  if (parts.length !== 4 || parts.some((num) => !Number.isInteger(num) || num < 0 || num > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
};

export const assertPublicHttpUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    const error = new Error("url is required");
    error.statusCode = 400;
    throw error;
  }

  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch {
    const error = new Error("invalid url");
    error.statusCode = 400;
    throw error;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const error = new Error("only http/https urls are allowed");
    error.statusCode = 400;
    throw error;
  }

  const hostname = String(parsed.hostname || "").toLowerCase();
  if (!hostname) {
    const error = new Error("invalid url hostname");
    error.statusCode = 400;
    throw error;
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    const error = new Error("local urls are not allowed");
    error.statusCode = 400;
    throw error;
  }
  if (hostname.includes(":")) {
    const error = new Error("ipv6 literal urls are not allowed");
    error.statusCode = 400;
    throw error;
  }
  if (isPrivateIPv4Host(hostname)) {
    const error = new Error("private network urls are not allowed");
    error.statusCode = 400;
    throw error;
  }

  return parsed.toString();
};

export const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = PRODUCT_METADATA_FETCH_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const normalizeUrlCandidate = (baseUrl, value) => {
  const raw = decodeHtmlEntities(String(value || "")).trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("javascript:")) return "";
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return "";
  }
};

export const toWwwHostUrl = (urlValue) => {
  let parsed = null;
  try {
    parsed = new URL(String(urlValue || "").trim());
  } catch {
    return "";
  }

  const hostname = String(parsed.hostname || "").toLowerCase();
  if (!hostname || hostname.startsWith("www.") || hostname === "localhost" || hostname.includes(":")) {
    return "";
  }
  if (isPrivateIPv4Host(hostname)) return "";
  if (hostname.split(".").length < 2) return "";

  parsed.hostname = `www.${hostname}`;
  return parsed.toString();
};

export const normalizePreferredStoreUrl = (urlValue) => {
  let parsed = null;
  try {
    parsed = new URL(String(urlValue || "").trim());
  } catch {
    return String(urlValue || "");
  }

  const hostname = String(parsed.hostname || "").toLowerCase();
  if (hostname === "musinsa.com" || hostname === "m.musinsa.com") {
    parsed.hostname = "www.musinsa.com";
    return parsed.toString();
  }

  return parsed.toString();
};
