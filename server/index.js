import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const SUPABASE_PRODUCTS_TABLE = (process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
const SUPABASE_STORAGE_BUCKET = (process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
const SUBMISSIONS_STORAGE_PREFIX = "submissions/";
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || "").trim();
const ADMIN_SESSION_COOKIE_NAME = "sizepicker_admin_session";
const ADMIN_SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 60 * 60 * 8);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PRODUCT_METADATA_FETCH_TIMEOUT_MS = Number(process.env.PRODUCT_METADATA_FETCH_TIMEOUT_MS || 12000);
const PRODUCT_METADATA_MAX_IMAGE_BYTES = Number(process.env.PRODUCT_METADATA_MAX_IMAGE_BYTES || 8 * 1024 * 1024);
const PRODUCT_METADATA_MAX_SIZE_CHART_PAGES = Number(
  process.env.PRODUCT_METADATA_MAX_SIZE_CHART_PAGES || 3
);
const PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_BYTES = Number(
  process.env.PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_BYTES || 12 * 1024
);
const PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_WIDTH = Number(
  process.env.PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_WIDTH || 320
);
const PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_HEIGHT = Number(
  process.env.PRODUCT_METADATA_MIN_SIZE_CHART_IMAGE_HEIGHT || 120
);
const PRODUCT_METADATA_MAX_SIZE_CHART_IMAGE_ASPECT_RATIO = Number(
  process.env.PRODUCT_METADATA_MAX_SIZE_CHART_IMAGE_ASPECT_RATIO || 6
);
const PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES = Number(
  process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES || 8 * 1024
);
const PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH = Number(
  process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH || 240
);
const PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT = Number(
  process.env.PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT || 240
);
const PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO = Number(
  process.env.PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2
);
const PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES = Number(
  process.env.PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES || 10
);
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, port: PORT, ts: new Date().toISOString() });
});

const assertSupabaseConfig = () => {
  if (!supabase) {
    const error = new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in server .env");
    error.statusCode = 500;
    throw error;
  }
};

const assertAdminConfig = () => {
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    const error = new Error("ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing in server .env");
    error.statusCode = 500;
    throw error;
  }
};

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const signValue = (value) =>
  createHmac("sha256", ADMIN_SESSION_SECRET).update(value).digest("base64url");

const makeAdminSessionToken = () => {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000 }),
    "utf8"
  ).toString("base64url");
  const signature = signValue(payload);
  return `${payload}.${signature}`;
};

const verifyAdminSessionToken = (token) => {
  if (!token || typeof token !== "string") return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expectedSignature = signValue(payload);
  if (!safeCompare(signature, expectedSignature)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const expiresAt = Number(parsed?.exp || 0);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  } catch {
    return false;
  }
};

const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separator = item.indexOf("=");
      if (separator < 0) return acc;
      const key = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});

const getAdminTokenFromRequest = (req) => {
  const cookies = parseCookies(String(req.headers.cookie || ""));
  return cookies[ADMIN_SESSION_COOKIE_NAME] || "";
};

const makeAdminCookie = (token) => {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
  ];
  if (IS_PRODUCTION) parts.push("Secure");
  return parts.join("; ");
};

const clearAdminCookie = () => {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (IS_PRODUCTION) parts.push("Secure");
  return parts.join("; ");
};

const requireAdminAuth = (req, res, next) => {
  if (!ADMIN_SESSION_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_SESSION_SECRET is missing in server .env",
    });
  }
  const token = getAdminTokenFromRequest(req);
  if (!verifyAdminSessionToken(token)) {
    return res.status(401).json({
      ok: false,
      error: "admin authentication required",
    });
  }
  return next();
};

const TOTAL_LENGTH_LABEL = "\uCD1D\uC7A5";
const ITEM_LABEL = "\uD56D\uBAA9";
const MEASUREMENT_LABEL_HINT_PATTERN =
  /(?:\uCD1D\uC7A5|\uAE30\uC7A5|\uC5B4\uAE68|\uAC00\uC2B4|\uC18C\uB9E4|\uD5C8\uB9AC|\uC5C9\uB369|\uD5C8\uBC85|\uBC11\uC704|\uBC11\uB2E8|\uAE38\uC774|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;
const MEASUREMENT_ALIAS_MAP = {
  "\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uC804\uCCB4\uAE38\uC774": TOTAL_LENGTH_LABEL,
  "\uC804\uCCB4\uC7A5": TOTAL_LENGTH_LABEL,
  "\uAE30\uC7A5": TOTAL_LENGTH_LABEL,
  "\uC0C1\uC758\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uD558\uC758\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uBC14\uC9C0\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "length": TOTAL_LENGTH_LABEL,
  "total": TOTAL_LENGTH_LABEL,
  "\uC18C\uB9E4": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uAE38\uC774": "\uC18C\uB9E4",
  "\uD654\uC7A5": "\uC18C\uB9E4",
  "sleeve": "\uC18C\uB9E4",
  "\uC5B4\uAE68": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB108\uBE44": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB113\uC774": "\uC5B4\uAE68",
  "shoulder": "\uC5B4\uAE68",
  "\uAC00\uC2B4": "\uAC00\uC2B4",
  "\uAC00\uC2B4\uB2E8\uBA74": "\uAC00\uC2B4",
  "\uD488": "\uAC00\uC2B4",
  "chest": "\uAC00\uC2B4",
  "bust": "\uAC00\uC2B4",
  "\uD5C8\uB9AC": "\uD5C8\uB9AC",
  "\uD5C8\uB9AC\uB2E8\uBA74": "\uD5C8\uB9AC",
  "waist": "\uD5C8\uB9AC",
  "\uC5C9\uB369\uC774": "\uC5C9\uB369\uC774",
  "\uD799": "\uC5C9\uB369\uC774",
  "hip": "\uC5C9\uB369\uC774",
  "\uD5C8\uBC85\uC9C0": "\uD5C8\uBC85\uC9C0",
  "\uD5C8\uBC85\uC9C0\uB2E8\uBA74": "\uD5C8\uBC85\uC9C0",
  "thigh": "\uD5C8\uBC85\uC9C0",
  "\uBC11\uC704": "\uBC11\uC704",
  "rise": "\uBC11\uC704",
  "\uBC11\uB2E8": "\uBC11\uB2E8",
  "\uBC11\uB2E8\uB2E8\uBA74": "\uBC11\uB2E8",
  "hem": "\uBC11\uB2E8",
  "\uC778\uC2EC": "\uC778\uC2EC",
  "inseam": "\uC778\uC2EC",
};
const TOTAL_LENGTH_ALIAS_KEYS = [
  "\uCD1D\uC7A5",
  "\uC804\uCCB4\uAE38\uC774",
  "\uC804\uCCB4\uC7A5",
  "\uAE30\uC7A5",
  "totallength",
  "length",
  "total",
];

const normalizeCellText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizeAliasKey = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z\u3131-\uD79D]/g, "");

const isTotalLengthAliasKey = (aliasKey) =>
  Boolean(aliasKey) &&
  TOTAL_LENGTH_ALIAS_KEYS.some((key) => aliasKey === key || aliasKey.includes(key));

const inferMeasurementLabelFromAliasKey = (aliasKey) => {
  if (!aliasKey) return "";
  if (aliasKey.includes("shoulder")) return "\uC5B4\uAE68";
  if (aliasKey.includes("chest") || aliasKey.includes("bust") || aliasKey.includes("bodywidth") || aliasKey.includes("pit")) {
    return "\uAC00\uC2B4";
  }
  if (aliasKey.includes("sleeve") || aliasKey.includes("arm")) return "\uC18C\uB9E4";
  if (aliasKey.includes("waist")) return "\uD5C8\uB9AC";
  if (aliasKey.includes("hip")) return "\uC5C9\uB369\uC774";
  if (aliasKey.includes("thigh")) return "\uD5C8\uBC85\uC9C0";
  if (aliasKey.includes("rise")) return "\uBC11\uC704";
  if (aliasKey.includes("hem")) return "\uBC11\uB2E8";
  if (aliasKey.includes("inseam")) return "\uC778\uC2EC";
  return "";
};

const normalizeMeasurementLabel = (value) => {
  const raw = normalizeCellText(value);
  if (!raw) return "";
  const sanitizedRaw = raw.replace(/^(?:cm|mm|in(?:ch)?)\s+/i, "");
  const aliasKey = normalizeAliasKey(sanitizedRaw);
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return MEASUREMENT_ALIAS_MAP[aliasKey] || inferMeasurementLabelFromAliasKey(aliasKey) || sanitizedRaw;
};

const normalizeSizeLabel = (value) => normalizeCellText(value).toUpperCase();

const normalizeComparableSizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return "";

  const alphaWithNumericMatch = text.match(/^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\(\s*\d{1,3}\s*\)$/i);
  if (alphaWithNumericMatch) return alphaWithNumericMatch[1].toUpperCase();

  const alphaWithDescriptorMatch = text.match(/^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\([^)]{1,30}\)$/i);
  if (alphaWithDescriptorMatch) return alphaWithDescriptorMatch[1].toUpperCase();

  const numericWithAlphaMatch = text.match(/^\d{1,3}\s*\(\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)$/i);
  if (numericWithAlphaMatch) return numericWithAlphaMatch[1].toUpperCase();

  const alphaWithSizeSuffixMatch = text.match(/^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*SIZE$/i);
  if (alphaWithSizeSuffixMatch) return alphaWithSizeSuffixMatch[1].toUpperCase();

  return text;
};

const isLikelySizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return false;
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\(\s*\d{1,3}\s*\)$/i.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\([^)]{1,30}\)$/i.test(text)) return true;
  if (/^\d{1,3}\s*\(\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)$/i.test(text)) return true;
  if (/^\d{1,3}\s*\(\s*\d{1,3}\s*~\s*\d{1,3}\s*\)$/.test(text)) return true;
  if (/^\d{1,3}\s*\([^)]{1,30}\)$/.test(text)) return true;
  if (/^(EU|US|UK|JP|KR)\s*\d{1,3}(?:\.\d+)?$/.test(text)) return true;
  if (/^(?:W|L)?\d{2,3}(?:\s*\/\s*(?:W|L)?\d{2,3})$/.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*[-/()]?\s*\d{2,3}$/.test(text)) return true;
  if (/^\d{2,3}\s*[-/()]?\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)$/.test(text)) return true;
  if (/^-?\d{1,4}(?:\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 400;
  }
  return false;
};

const isLikelyMeasurementLabel = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  return Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized);
};

const isLikelyMeasurementLabelLoose = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  if (Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized)) return true;
  return MEASUREMENT_LABEL_HINT_PATTERN.test(normalizeCellText(value));
};

const makeRectangularRows = (rows, width) =>
  rows.map((row) => {
    const normalized = Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : [];
    return [...normalized, ...new Array(Math.max(width - normalized.length, 0)).fill("")].slice(0, width);
  });

const transposeTable = ({ headers, rows }) => {
  const width = Math.max(headers.length, ...rows.map((row) => row.length), 0);
  const fullHeaders = [...headers, ...new Array(Math.max(width - headers.length, 0)).fill("")];
  const fullRows = makeRectangularRows(rows, width);
  const matrix = [fullHeaders, ...fullRows];
  if (matrix.length === 0 || width === 0) return { headers: [], rows: [] };
  const transposed = Array.from({ length: width }, (_, colIdx) =>
    matrix.map((row) => normalizeCellText(row[colIdx]))
  );
  return { headers: transposed[0] || [], rows: transposed.slice(1) };
};

const tableOrientationScore = (table) => {
  const columnHeaders = table.headers.slice(1);
  const rowHeaders = table.rows.map((row) => row[0] || "");
  const sizeInColumns = columnHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const measurementInRows = rowHeaders.filter((v) => isLikelyMeasurementLabelLoose(v)).length;
  const sizeInRows = rowHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const measurementInColumns = columnHeaders.filter((v) => isLikelyMeasurementLabelLoose(v)).length;
  const numericRowHeaders = rowHeaders.filter((value) =>
    /^-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?$/i.test(normalizeCellText(value))
  ).length;
  return (
    sizeInColumns * 4 +
    measurementInRows * 4 -
    sizeInRows * 4 -
    measurementInColumns * 3 -
    numericRowHeaders * 2
  );
};

const sortMeasurementRows = (rows) => {
  const nextRows = [...rows];
  const totalLengthIndex = nextRows.findIndex(
    (row) => normalizeMeasurementLabel(row?.[0] || "") === TOTAL_LENGTH_LABEL
  );
  if (totalLengthIndex <= 0) return nextRows;
  const [totalLengthRow] = nextRows.splice(totalLengthIndex, 1);
  nextRows.unshift(totalLengthRow);
  return nextRows;
};

const standardizeSizeTable = (value) => {
  if (!value || typeof value !== "object") return null;
  const parsed = value;
  const headers = Array.isArray(parsed.headers)
    ? parsed.headers.map((header) => normalizeCellText(header))
    : [];
  const rows = Array.isArray(parsed.rows)
    ? parsed.rows.map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []))
    : [];
  if (headers.length === 0 && rows.length === 0) return null;

  const asIs = { headers: [...headers], rows: rows.map((row) => [...row]) };
  const transposed = transposeTable(asIs);
  const selected =
    tableOrientationScore(transposed) > tableOrientationScore(asIs) ? transposed : asIs;

  const width = Math.max(selected.headers.length, ...selected.rows.map((row) => row.length), 0);
  if (width === 0) return null;
  const normalizedHeaders = [...selected.headers, ...new Array(width - selected.headers.length).fill("")].slice(0, width);
  normalizedHeaders[0] = ITEM_LABEL;
  for (let idx = 1; idx < normalizedHeaders.length; idx += 1) {
    normalizedHeaders[idx] = normalizeSizeLabel(normalizedHeaders[idx]);
  }

  const normalizedRows = makeRectangularRows(selected.rows, width).map((row) => {
    const nextRow = [...row];
    nextRow[0] = normalizeMeasurementLabel(nextRow[0]);
    return nextRow;
  });

  return {
    headers: normalizedHeaders,
    rows: sortMeasurementRows(normalizedRows),
  };
};

const parseSizeTable = (value) => {
  if (!value) return null;

  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;
  return standardizeSizeTable(parsed);
};

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripHtml = (value) =>
  decodeHtmlEntities(
    String(value || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeBrandName = (value) =>
  normalizeCellText(value)
    .replace(/\s*怨듭떇\s*?⑤씪??s*?ㅽ넗??/i, "")
    .replace(/\s*怨듭떇\s*?ㅽ넗??/i, "")
    .replace(/\s*?⑤씪??s*?ㅽ넗??/i, "")
    .replace(/\s*official\s+online\s+store$/i, "")
    .replace(/\s*official\s+store$/i, "")
    .trim();

const pickFirstNonEmpty = (values) => {
  for (const value of values) {
    const normalized = normalizeCellText(value);
    if (normalized) return normalized;
  }
  return "";
};

const uniqValues = (values) => {
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

const assertPublicHttpUrl = (value) => {
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

const fetchWithTimeout = async (url, options = {}, timeoutMs = PRODUCT_METADATA_FETCH_TIMEOUT_MS) => {
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

const normalizeUrlCandidate = (baseUrl, value) => {
  const raw = decodeHtmlEntities(String(value || "")).trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("javascript:")) return "";
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return "";
  }
};

const toWwwHostUrl = (urlValue) => {
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

const normalizePreferredStoreUrl = (urlValue) => {
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

const parseHtmlAttributes = (tag) => {
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

const extractHtmlTitle = (html) => {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeCellText(decodeHtmlEntities(match?.[1] || ""));
};

const extractMetaContent = (html, key, attrName) => {
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

const extractJsonLdObjects = (html) => {
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

const extractProductJsonLd = (html) => {
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
    images: rawImages.map((value) => normalizeCellText(value)).filter(Boolean),
  };
};

const extractNextDataPayload = (html) => {
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

const extractMusinsaPageData = (nextDataPayload) => {
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
    imageCandidates,
    textBlocks: [meta?.goodsContents || "", meta?.specDesc || ""],
  };
};

const SIZE_KEY_NAME_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uC635\uC158|\uCE58\uC218|\uADDC\uACA9|\uD638\uC218)/i;
const SIZE_HINT_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|chart|guide|measurement|spec|\bcm\b)/i;
const IMAGE_KEY_HINT_PATTERN =
  /(?:image|img|photo|picture|thumbnail|thumb|zoom|src)/i;
const SIZE_TABLE_STOP_PATTERN =
  /(?:model|detail|fabric|delivery|shipping|material|\uC18C\uC7AC|\uC138\uD0C1|\uBC30\uC1A1|\uC0C1\uC138|\*)/i;
const SIZE_LABEL_TOKEN_PATTERN = /(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})/gi;
const IMAGE_URL_PATTERN = /\.(?:png|jpe?g|webp|gif|bmp|svg)(?:[?#].*)?$/i;
const URL_VALUE_HINT_PATTERN =
  /^(?:https?:)?\/\/|^\/[^/]|^\.\.?\//i;
const HTML_PAGE_PATH_PATTERN = /\.(?:html?|php|aspx?|jsp)(?:[?#].*)?$/i;
const SIZE_CHART_PATH_HINT_PATTERN = /(?:size|chart|guide|measurement|spec|fit)/i;
const MEASUREMENT_KEY_HINT_PATTERN =
  /(?:\uCD1D\uC7A5|\uAE30\uC7A5|\uC5B4\uAE68|\uAC00\uC2B4|\uC18C\uB9E4|\uD5C8\uB9AC|\uC5C9\uB369|\uD5C8\uBC85|\uBC11\uC704|\uBC11\uB2E8|\uAE38\uC774|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;
const SIZE_CHART_IMAGE_REJECT_PATH_PATTERN =
  /(?:\/design\/skin\/|\/skin\/base\/|\/layout\/|\/common\/|\/btn\/|\/icon\/|\/sprite\/)/i;
const SIZE_CHART_IMAGE_REJECT_FILE_PATTERN =
  /(?:^|[\/_])(btn|txt|ico|icon|sprite|loading|loader|placeholder)(?:_|-|\.|$)/i;
const SIZE_CHART_IMAGE_REJECT_HOST_PATTERN = /(?:^|\.)img\.echosting\.cafe24\.com$/i;
const PRODUCT_IMAGE_POSITIVE_HINT_PATTERN =
  /(?:product|goods|item|prd|main|front|cover|thumbnail|thumb|image|photo|zoom|large|big|\uC0C1\uD488|\uB300\uD45C|\uBA54\uC778)/i;
const PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN =
  /(?:logo|icon|banner|sprite|avatar|profile|review|event|lookbook|campaign|editorial|video|youtube|swatch|colorchip|watermark|model|detail-cut|detailcut|\uB85C\uACE0|\uC544\uC774\uCF58|\uBC30\uB108|\uB9AC\uBDF0|\uB8E9\uBD81|\uBAA8\uB378)/i;

const extractBrandFromDescription = (description) => {
  const brandMatch = String(description || "").match(/(?:brand|\uBE0C\uB79C\uB4DC)\s*[:\-]?\s*([^,|]+)/i);
  return normalizeBrandName(brandMatch?.[1] || "");
};

const isLikelySizeChartImageUrl = (url) => {
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

const sortSizeChartImageCandidates = (candidates) =>
  uniqValues(candidates).sort((left, right) => scoreSizeChartImageCandidate(right) - scoreSizeChartImageCandidate(left));

const scoreProductImageCandidate = (url, hintText = "") => {
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
  if (/(?:^|[_\-/.])(main|front|cover|represent|thumb0?1)(?:[_\-/.]|$)/i.test(fileName)) score += 5;
  if (/(?:big|large|zoom|origin|original|xlarge)/i.test(hint)) score += 3;
  if (/\/web\/product\/big\//i.test(pathname)) score += 7;
  if (/\/web\/product\/small\//i.test(pathname)) score -= 4;
  if (/\/product\/extra\//i.test(pathname)) score -= 6;
  if (/\/goods_img\//i.test(pathname)) score += 6;

  if (PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN.test(hint)) score -= 12;
  if (SIZE_HINT_PATTERN.test(hint) || SIZE_CHART_PATH_HINT_PATTERN.test(hint)) score -= 28;
  if (SIZE_CHART_IMAGE_REJECT_HOST_PATTERN.test(parsedUrl.hostname)) score -= 80;
  if (SIZE_CHART_IMAGE_REJECT_PATH_PATTERN.test(pathname)) score -= 80;
  if (SIZE_CHART_IMAGE_REJECT_FILE_PATTERN.test(fileName)) score -= 80;
  if (/\.gif(?:[?#].*)?$/.test(normalized)) score -= 25;
  if (/\.svg(?:[?#].*)?$/.test(normalized)) score -= 20;
  if (!IMAGE_URL_PATTERN.test(pathname) && !IMAGE_URL_PATTERN.test(normalized)) score -= 2;

  const widthParam = Number(
    parsedUrl.searchParams.get("w") ||
      parsedUrl.searchParams.get("width") ||
      parsedUrl.searchParams.get("img_w") ||
      0
  );
  const heightParam = Number(
    parsedUrl.searchParams.get("h") ||
      parsedUrl.searchParams.get("height") ||
      parsedUrl.searchParams.get("img_h") ||
      0
  );
  if (Number.isFinite(widthParam) && widthParam > 0 && widthParam < 220) score -= 10;
  if (Number.isFinite(heightParam) && heightParam > 0 && heightParam < 220) score -= 8;
  if (Number.isFinite(widthParam) && widthParam >= 600) score += 2;
  if (Number.isFinite(heightParam) && heightParam >= 600) score += 2;

  return score;
};

const sortProductImageCandidates = (candidates, hintText = "") => {
  const scored = uniqValues(candidates).map((candidate) => ({
    url: candidate,
    score: scoreProductImageCandidate(candidate, hintText),
  }));
  return scored
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.url);
};

const addImageResolutionVariants = (candidates) => {
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

const extractProductNameFromTitle = (title, brand) => {
  const firstChunk = normalizeCellText(String(title || "").split("|")[0]);
  if (!firstChunk) return "";
  const withoutSuffix = normalizeCellText(firstChunk.split(" - ")[0]);
  if (!withoutSuffix) return "";
  if (!brand) return withoutSuffix;

  const pattern = new RegExp(`^${escapeRegExp(brand)}(?:\\s*\\([^)]*\\))?\\s*`, "i");
  const withoutBrand = normalizeCellText(withoutSuffix.replace(pattern, ""));
  return withoutBrand || withoutSuffix;
};

const extractOptionSizeLabelsFromHtml = (html) => {
  const labels = [];

  const listItemPattern = /<li\b[^>]*\boption_value=(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
  let listItemMatch = null;
  while ((listItemMatch = listItemPattern.exec(String(html || ""))) !== null) {
    const candidate = normalizeSizeLabel(listItemMatch[1] || listItemMatch[2] || "");
    if (isLikelySizeLabel(candidate)) labels.push(candidate);
  }

  const optionMapperMatch = String(html || "").match(/option_value_mapper\s*=\s*(['"`])([\s\S]*?)\1/i);
  if (optionMapperMatch?.[2]) {
    const rawMapper = decodeHtmlEntities(optionMapperMatch[2]);
    const mapperCandidates = uniqValues([
      rawMapper,
      rawMapper.replace(/\\"/g, "\"").replace(/\\'/g, "'"),
      rawMapper.replace(/\\\\\"/g, "\"").replace(/\\\\'/g, "'"),
    ]);

    for (const mapperCandidate of mapperCandidates) {
      try {
        const parsedMapper = JSON.parse(mapperCandidate);
        if (!parsedMapper || typeof parsedMapper !== "object") continue;
        for (const key of Object.keys(parsedMapper)) {
          const candidate = normalizeSizeLabel(key);
          if (isLikelySizeLabel(candidate)) labels.push(candidate);
        }
      } catch {
        continue;
      }
    }
  }

  const optionStockDataMatch = String(html || "").match(/option_stock_data\s*=\s*'([^']+)'/i);
  if (optionStockDataMatch?.[1]) {
    const rawStockData = optionStockDataMatch[1];
    const optionValueMatches = rawStockData.matchAll(/\\"option_value\\"\s*:\s*\\"([^\\"]+)\\"/g);
    for (const match of optionValueMatches) {
      const candidate = normalizeSizeLabel(match?.[1] || "");
      if (isLikelySizeLabel(candidate)) labels.push(candidate);
    }
  }

  return uniqValues(labels);
};

const areSequentialNumericSizeHeaders = (headers) =>
  Array.isArray(headers) &&
  headers.length > 0 &&
  headers.every((header, index) => {
    const normalized = normalizeSizeLabel(header);
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return false;
    return Number(normalized) === index;
  });

const hasUsableSizeTableShape = (table) => {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) return false;
  if (table.headers.length < 3 || table.rows.length < 1) return false;

  const normalizedRows = table.rows
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => row.length > 0);
  if (normalizedRows.length < 1) return false;

  const measurementLikeRows = normalizedRows.filter((row) =>
    isLikelyMeasurementLabelLoose(row?.[0] || "") || isLikelyMeasurementKey(row?.[0] || "")
  ).length;
  if (measurementLikeRows < 1) return false;

  let numericCells = 0;
  for (const row of normalizedRows) {
    for (const cell of row.slice(1)) {
      if (parseNumericCellValue(cell) !== null) numericCells += 1;
    }
  }
  if (numericCells < Math.max(2, table.headers.length - 1)) return false;
  return true;
};

const alignAndValidateSizeTableByOptionLabels = (table, optionSizeLabels = []) => {
  if (!table) return null;
  if (!hasUsableSizeTableShape(table)) return null;

  const normalizedOptions = uniqValues(
    (optionSizeLabels || [])
      .map((value) => normalizeComparableSizeLabel(value))
      .filter((value) => isLikelySizeLabel(value))
  );
  if (normalizedOptions.length < 2) return table;

  const normalizedHeaders = table.headers
    .slice(1)
    .map((value) => normalizeComparableSizeLabel(value))
    .filter(Boolean);
  if (normalizedHeaders.length < 2) return null;

  const shouldReplaceHeaders =
    areSequentialNumericSizeHeaders(normalizedHeaders) &&
    normalizedOptions.length === normalizedHeaders.length;
  if (shouldReplaceHeaders) {
    return {
      headers: [table.headers[0] || ITEM_LABEL, ...normalizedOptions],
      rows: table.rows,
    };
  }

  const optionSet = new Set(normalizedOptions);
  const optionIndexByValue = new Map();
  normalizedHeaders.forEach((value, index) => {
    if (!optionSet.has(value)) return;
    if (!optionIndexByValue.has(value)) optionIndexByValue.set(value, index + 1);
  });
  const matchedOptionsInOrder = normalizedOptions.filter((value) => optionIndexByValue.has(value));
  if (matchedOptionsInOrder.length >= 2) {
    const projectedHeaders = [table.headers[0] || ITEM_LABEL, ...matchedOptionsInOrder];
    const projectedRows = table.rows.map((row) => [
      row?.[0] || "",
      ...matchedOptionsInOrder.map((optionValue) => row?.[optionIndexByValue.get(optionValue)] || ""),
    ]);
    const projectedTable = {
      headers: projectedHeaders,
      rows: projectedRows,
    };
    return hasUsableSizeTableShape(projectedTable) ? projectedTable : null;
  }

  const overlapCount = normalizedHeaders.filter((header) => optionSet.has(header)).length;
  const requiredOverlap = Math.max(
    1,
    Math.min(2, Math.ceil(Math.min(normalizedHeaders.length, normalizedOptions.length) * 0.5))
  );
  if (overlapCount < requiredOverlap) return null;
  if (normalizedHeaders.length > normalizedOptions.length + 1) return null;
  const unknownHeaderCount = normalizedHeaders.filter((header) => !optionSet.has(header)).length;
  if (unknownHeaderCount > Math.max(1, Math.floor(normalizedHeaders.length * 0.4))) return null;
  return table;
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNumericLikeCell = (value) => {
  const text = normalizeCellText(value).toLowerCase();
  if (!text) return false;
  const cleaned = text
    .replace(/,/g, "")
    .replace(/\b(cm|mm|in|inch|kg|g|oz)\b/g, "")
    .replace(/\s+/g, "");
  return /^-?\d+(?:\.\d+)?$/.test(cleaned);
};

const parseNumericCellValue = (value) => {
  const text = normalizeCellText(value).toLowerCase();
  if (!text) return null;
  const cleaned = text
    .replace(/,/g, "")
    .replace(/\b(cm|mm|in|inch|kg|g|oz)\b/g, "")
    .replace(/\s+/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
};

const isLikelyMeasurementKey = (value) => {
  const text = normalizeCellText(value);
  if (!text) return false;
  if (isLikelyMeasurementLabel(text)) return true;
  return MEASUREMENT_KEY_HINT_PATTERN.test(text);
};

const looksLikeUrlValue = (value) => {
  const text = normalizeCellText(value);
  if (!text || /\s/.test(text) || text.length > 1500) return false;
  if (URL_VALUE_HINT_PATTERN.test(text)) return true;
  if (HTML_PAGE_PATH_PATTERN.test(text)) return true;
  if (/^[A-Za-z0-9/_-]+(?:\?[^\s]*)?$/.test(text) && SIZE_CHART_PATH_HINT_PATTERN.test(text)) return true;
  return false;
};

const scoreSizeTableCandidate = (table) => {
  if (!table) return -1;
  if (!hasUsableSizeTableShape(table)) return -1;
  const hintedMeasurementRows = table.rows.filter((row) =>
    isLikelyMeasurementKey(row?.[0] || "")
  ).length;
  if (hintedMeasurementRows === 0) return -1;

  const numericValues = [];
  for (const row of table.rows) {
    for (const cell of row.slice(1)) {
      const numeric = parseNumericCellValue(cell);
      if (numeric === null) continue;
      numericValues.push(numeric);
    }
  }
  if (numericValues.length >= 2) {
    const plausibleCount = numericValues.filter((value) => value > 0 && value <= 400).length;
    if (plausibleCount / numericValues.length < 0.5) return -1;
  }

  const normalizedSizeHeaders = table.headers
    .slice(1)
    .map((header) => normalizeComparableSizeLabel(header))
    .filter(Boolean);
  const sizeHeaderCount = normalizedSizeHeaders.filter((header) => isLikelySizeLabel(header)).length;
  const measurementRowCount = table.rows.filter((row) => isLikelyMeasurementLabel(row?.[0] || "")).length;
  const alphaSizeHeaderCount = normalizedSizeHeaders.filter((header) =>
    /^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(header)
  ).length;
  const numericSizeHeaderCount = normalizedSizeHeaders.filter((header) =>
    /^\d{1,4}(?:\s*\([^)]{1,30}\))?$/i.test(header)
  ).length;
  const mixedHeaderPenalty = alphaSizeHeaderCount > 0 && numericSizeHeaderCount > 0 ? 5 : 0;

  return (
    sizeHeaderCount * 3 +
    measurementRowCount * 3 +
    hintedMeasurementRows * 2 +
    table.rows.length -
    mixedHeaderPenalty
  );
};

const extractProductImageCandidatesFromHtml = ({ html, pageUrl }) => {
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

const extractImageCandidatesFromHtml = ({ html, pageUrl, priorityPattern }) => {
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

const extractJsonObjectsFromApplicationScripts = (html) => {
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

const extractSizeTableFromArrayOfArrays = (rows) => {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const normalized = rows
    .map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []))
    .filter((row) => row.length >= 2);
  if (normalized.length < 2) return null;

  return standardizeSizeTable({
    headers: normalized[0],
    rows: normalized.slice(1),
  });
};

const extractSizeTableFromArrayOfObjects = (rows) => {
  const objects = Array.isArray(rows) ? rows.filter((row) => isPlainObject(row)) : [];
  if (objects.length < 2) return null;

  const keyCounts = new Map();
  for (const row of objects) {
    for (const key of Object.keys(row)) {
      const normalizedKey = normalizeCellText(key);
      if (!normalizedKey) continue;
      keyCounts.set(normalizedKey, (keyCounts.get(normalizedKey) || 0) + 1);
    }
  }
  const minPresence = Math.max(2, Math.ceil(objects.length * 0.6));
  const commonKeys = [...keyCounts.entries()]
    .filter(([, count]) => count >= minPresence)
    .map(([key]) => key);
  if (commonKeys.length < 2) return null;

  const sizeScoreForKey = (key) =>
    objects.reduce((score, row) => score + (isLikelySizeLabel(row[key]) ? 1 : 0), 0);

  let sizeKey =
    commonKeys.find((key) => SIZE_KEY_NAME_PATTERN.test(key)) ||
    commonKeys
      .map((key) => ({ key, score: sizeScoreForKey(key) }))
      .sort((left, right) => right.score - left.score)[0]?.key ||
    "";
  if (!sizeKey || sizeScoreForKey(sizeKey) < 2) return null;

  const sizeValues = objects.map((row) => normalizeSizeLabel(row[sizeKey])).filter(Boolean);
  if (uniqValues(sizeValues).length < 2) return null;

  const measureKeys = commonKeys.filter((key) => {
    if (key === sizeKey) return false;
    const numericCount = objects.reduce(
      (count, row) => count + (isNumericLikeCell(row[key]) ? 1 : 0),
      0
    );
    return numericCount >= minPresence;
  });
  if (measureKeys.length === 0) return null;
  if (measureKeys.filter((key) => isLikelyMeasurementKey(key)).length === 0) return null;

  return standardizeSizeTable({
    headers: ["size", ...sizeValues],
    rows: measureKeys.map((key) => [key, ...objects.map((row) => normalizeCellText(row[key]))]),
  });
};

const extractSizeTableFromSizeMapObject = (node) => {
  if (!isPlainObject(node)) return null;
  const entries = Object.entries(node).filter(
    ([, value]) => isPlainObject(value) && Object.keys(value).length >= 1
  );
  if (entries.length < 2) return null;
  const sizeLabels = entries.map(([key]) => normalizeSizeLabel(key)).filter(Boolean);
  if (sizeLabels.filter((label) => isLikelySizeLabel(label)).length < 2) return null;

  const valueObjects = entries.map(([, value]) => value);
  const keyCounts = new Map();
  for (const item of valueObjects) {
    for (const key of Object.keys(item)) {
      const normalizedKey = normalizeCellText(key);
      if (!normalizedKey) continue;
      keyCounts.set(normalizedKey, (keyCounts.get(normalizedKey) || 0) + 1);
    }
  }
  const minPresence = Math.max(2, Math.ceil(valueObjects.length * 0.6));
  const measureKeys = [...keyCounts.entries()]
    .filter(([, count]) => count >= minPresence)
    .map(([key]) => key)
    .filter((key) => {
      const numericCount = valueObjects.reduce(
        (count, item) => count + (isNumericLikeCell(item[key]) ? 1 : 0),
        0
      );
      return numericCount >= minPresence;
    });
  if (measureKeys.length === 0) return null;
  if (measureKeys.filter((key) => isLikelyMeasurementKey(key)).length === 0) return null;

  return standardizeSizeTable({
    headers: ["size", ...sizeLabels],
    rows: measureKeys.map((key) => [key, ...valueObjects.map((item) => normalizeCellText(item[key]))]),
  });
};

const extractSizeTableFromJsonData = (jsonData) => {
  if (!jsonData) return null;
  const stack = [jsonData];
  let visited = 0;
  let bestTable = null;
  let bestScore = -1;

  while (stack.length > 0 && visited < 3000) {
    const node = stack.pop();
    visited += 1;

    const consider = (table) => {
      const score = scoreSizeTableCandidate(table);
      if (score > bestScore) {
        bestScore = score;
        bestTable = table;
      }
    };

    if (Array.isArray(node)) {
      consider(extractSizeTableFromArrayOfArrays(node));
      consider(extractSizeTableFromArrayOfObjects(node));
      for (const item of node) {
        if (item && typeof item === "object") stack.push(item);
      }
      continue;
    }
    if (!isPlainObject(node)) continue;

    if (Array.isArray(node.headers) && Array.isArray(node.rows)) {
      consider(parseSizeTable(node));
    }
    consider(extractSizeTableFromSizeMapObject(node));

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") stack.push(value);
    }
  }

  return bestScore >= 4 ? bestTable : null;
};

const collectTextBlocksFromJsonData = (jsonData) => {
  const blocks = [];
  const stack = [{ node: jsonData, keyHint: "" }];
  let visited = 0;

  while (stack.length > 0 && visited < 4000 && blocks.length < 80) {
    const { node, keyHint } = stack.pop();
    visited += 1;

    if (typeof node === "string") {
      const text = normalizeCellText(node);
      if (text.length >= 8 && text.length <= 2000) {
        const combined = `${keyHint} ${text}`;
        if (SIZE_HINT_PATTERN.test(combined)) blocks.push(text);
      }
      continue;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push({ node: item, keyHint });
      }
      continue;
    }
    if (!isPlainObject(node)) continue;

    for (const [key, value] of Object.entries(node)) {
      const nextHint = `${keyHint} ${String(key || "")}`.trim();
      stack.push({ node: value, keyHint: nextHint });
    }
  }

  return uniqValues(blocks);
};

const extractImageCandidatesFromJsonData = ({ jsonData, pageUrl }) => {
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
    if (!isPlainObject(node)) continue;

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

const extractSizeChartPageCandidatesFromJsonData = ({ jsonData, pageUrl }) => {
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
    if (!isPlainObject(node)) continue;

    for (const [key, value] of Object.entries(node)) {
      const nextHint = `${keyHint} ${String(key || "")}`.trim();
      stack.push({ node: value, keyHint: nextHint });
    }
  }

  return uniqValues(candidates);
};

const extractSizeChartPageCandidatesFromHtml = ({ html, pageUrl }) => {
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

const extractSizeTableFromHtmlTables = (html) => {
  const tablePattern = /<table[\s\S]*?<\/table>/gi;
  let bestScore = -1;
  let bestTable = null;
  let tableMatch = null;

  while ((tableMatch = tablePattern.exec(String(html || ""))) !== null) {
    const tableHtml = tableMatch[0];
    const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
    const rows = [];
    let rowMatch = null;
    while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
      const cellPattern = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
      const cells = [];
      let cellMatch = null;
      while ((cellMatch = cellPattern.exec(rowMatch[0])) !== null) {
        const cleaned = normalizeCellText(stripHtml(cellMatch[1]));
        if (cleaned) cells.push(cleaned);
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length < 2) continue;
    const candidate = standardizeSizeTable({
      headers: rows[0],
      rows: rows.slice(1),
    });
    if (!candidate) continue;

    const keywordBoost =
      /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|cm|\uCD1D\uC7A5|\uAC00\uC2B4|\uC5B4\uAE68|\uD5C8\uB9AC|\uC18C\uB9E4)/i
        .test(stripHtml(tableHtml))
        ? 2
        : 0;
    const score = scoreSizeTableCandidate(candidate) + keywordBoost;
    if (score > bestScore) {
      bestScore = score;
      bestTable = candidate;
    }
  }

  return bestScore >= 4 ? bestTable : null;
};

const extractSizeTableFromPlainText = (value) => {
  const text = normalizeCellText(value);
  if (!text) return null;

  const indexedSizeRows = [];
  const indexedSizeRowPattern = /\[(\d{1,3})\]\s*([\s\S]*?)(?=(?:\[\d{1,3}\])|$)/g;
  let indexedSizeRowMatch = null;
  while ((indexedSizeRowMatch = indexedSizeRowPattern.exec(text)) !== null) {
    const sizeValue = normalizeSizeLabel(indexedSizeRowMatch[1] || "");
    const bodySegment = normalizeCellText(indexedSizeRowMatch[2] || "");
    if (!sizeValue || !bodySegment) continue;

    const measurementOrder = [];
    const measurementValues = new Map();
    const segmentTokens = bodySegment.split(/\s*\/\s*/).map((token) => normalizeCellText(token)).filter(Boolean);
    for (const token of segmentTokens) {
      const tokenMatch = token.match(
        /^([A-Za-z\u3131-\uD79D ]{1,30})\s*[:\-]?\s*(-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?)$/i
      );
      if (!tokenMatch) continue;

      const normalizedLabel = normalizeMeasurementLabel(tokenMatch[1]);
      if (!isLikelyMeasurementLabelLoose(normalizedLabel)) continue;
      const normalizedValue = normalizeCellText(tokenMatch[2]).replace(/\s*(?:cm|mm|in|inch)\b/gi, "");
      if (!normalizedValue) continue;
      if (!measurementValues.has(normalizedLabel)) measurementOrder.push(normalizedLabel);
      measurementValues.set(normalizedLabel, normalizedValue);
    }

    if (measurementValues.size < 2) continue;
    indexedSizeRows.push({
      sizeValue,
      measurementOrder,
      measurementValues,
    });
  }

  if (indexedSizeRows.length >= 2) {
    const sizeHeaders = uniqValues(indexedSizeRows.map((row) => row.sizeValue));
    if (sizeHeaders.length >= 2) {
      const measurementLabels = [];
      const measurementLabelSet = new Set();
      for (const row of indexedSizeRows) {
        for (const label of row.measurementOrder) {
          if (!label || measurementLabelSet.has(label)) continue;
          measurementLabelSet.add(label);
          measurementLabels.push(label);
        }
      }

      if (measurementLabels.length >= 2) {
        const rows = measurementLabels.map((label) => [
          label,
          ...indexedSizeRows.map((row) => row.measurementValues.get(label) || ""),
        ]);
        const parsedIndexedTable = standardizeSizeTable({
          headers: ["size", ...sizeHeaders],
          rows,
        });
        if (parsedIndexedTable) return parsedIndexedTable;
      }
    }
  }

  const genericSizeHeaderPattern =
    /((?<![A-Za-z0-9])(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})(?:\s*\([^)]{1,30}\))?(?![A-Za-z0-9])(?:\s*\/\s*(?<![A-Za-z0-9])(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})(?:\s*\([^)]{1,30}\))?(?![A-Za-z0-9])){1,9})/gi;
  let bestGenericTable = null;
  let bestGenericScore = -1;
  let genericSizeHeaderMatch = null;
  while ((genericSizeHeaderMatch = genericSizeHeaderPattern.exec(text)) !== null) {
    const rawSizeValues =
      genericSizeHeaderMatch[1].match(
        /(?<![A-Za-z0-9])(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})(?:\s*\([^)]{1,30}\))?(?![A-Za-z0-9])/gi
      ) || [];
    const sizeValues = uniqValues(
      rawSizeValues
        .map((token) => normalizeComparableSizeLabel(token))
        .filter((token) => isLikelySizeLabel(token))
    );
    if (sizeValues.length < 2) continue;

    const bodySegment = text
      .slice((genericSizeHeaderMatch.index || 0) + genericSizeHeaderMatch[0].length)
      .split(SIZE_TABLE_STOP_PATTERN)[0];
    const measurementPattern =
      /([A-Za-z\u3131-\uD79D ]{1,30})\s*[:\-]?\s*(-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?(?:\s*(?:\/|\||,)\s*-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?){1,10})/gi;
    const rows = [];
    let measurementMatch = null;
    while ((measurementMatch = measurementPattern.exec(bodySegment)) !== null) {
      const normalizedLabel = normalizeMeasurementLabel(measurementMatch[1]);
      if (!isLikelyMeasurementLabelLoose(normalizedLabel)) continue;
      const values = (measurementMatch[2].match(/-?\d+(?:\.\d+)?/g) || []).slice(0, sizeValues.length);
      if (values.length < 2) continue;
      rows.push([normalizedLabel, ...values]);
    }
    if (rows.length === 0) continue;

    const parsedTable = standardizeSizeTable({
      headers: ["size", ...sizeValues],
      rows,
    });
    if (!parsedTable) continue;

    const alphaSizeCount = sizeValues.filter((value) =>
      /^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(value)
    ).length;
    const numericSizeCount = sizeValues.filter((value) => /^\d{1,4}$/.test(value)).length;
    let candidateScore = scoreSizeTableCandidate(parsedTable) + sizeValues.length * 3 + alphaSizeCount;
    if (alphaSizeCount === 1 && numericSizeCount >= 1) candidateScore -= 6;
    if (candidateScore > bestGenericScore) {
      bestGenericScore = candidateScore;
      bestGenericTable = parsedTable;
    }
  }
  if (bestGenericTable) return bestGenericTable;

  const sizeBlock = text.match(/(?:size|\uC0AC\uC774\uC988)\s*\(([^)]+)\)\s*([\s\S]{0,1200})/i);
  if (sizeBlock) {
    const measurementHeaders = String(sizeBlock[1] || "")
      .split(/[\/|,]/)
      .map((item) => normalizeCellText(item))
      .filter(Boolean);
    if (measurementHeaders.length > 0) {
      const bodySegment = String(sizeBlock[2] || "").split(SIZE_TABLE_STOP_PATTERN)[0];
      const rowPattern =
        /((?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4}))\s*:\s*([0-9.]+(?:\s*\/\s*[0-9.]+){1,8})/gi;
      const rows = [];
      let rowMatch = null;
      while ((rowMatch = rowPattern.exec(bodySegment)) !== null) {
        const sizeValue = normalizeSizeLabel(rowMatch[1]);
        const measurements = String(rowMatch[2] || "")
          .split("/")
          .map((item) => normalizeCellText(item))
          .filter(Boolean);
        if (measurements.length < 2) continue;
        rows.push([sizeValue, ...measurements]);
      }
      if (rows.length > 0) {
        const valueColumnCount = Math.max(...rows.map((row) => Math.max(row.length - 1, 0)), 0);
        if (valueColumnCount > 0) {
          const headers = ["size", ...measurementHeaders.slice(0, valueColumnCount)];
          while (headers.length <= valueColumnCount) headers.push(`measure_${headers.length}`);
          const normalizedRows = rows.map((row) => [row[0], ...row.slice(1, valueColumnCount + 1)]);
          const table = standardizeSizeTable({ headers, rows: normalizedRows });
          if (table) return table;
        }
      }
    }
  }

  const headerMatch = text.match(
    /(?:size|\uC0AC\uC774\uC988)\s*(?:\([^)]*\))?\s*((?:(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})\s*){2,10})/i
  );
  if (!headerMatch) return null;

  const sizeValues = (headerMatch[1].match(SIZE_LABEL_TOKEN_PATTERN) || []).map((token) =>
    normalizeSizeLabel(token)
  );
  if (uniqValues(sizeValues).length < 2) return null;

  const bodySegment = text
    .slice((headerMatch.index || 0) + headerMatch[0].length)
    .split(SIZE_TABLE_STOP_PATTERN)[0];
  const measurementPattern =
    /([A-Za-z\u3131-\uD79D]{1,20})\s*[:\-]?\s*([0-9.]+(?:\s*(?:\/|\||,)\s*[0-9.]+|\s+[0-9.]+){1,10})/g;
  const rows = [];
  let measurementMatch = null;
  while ((measurementMatch = measurementPattern.exec(bodySegment)) !== null) {
    const normalizedLabel = normalizeMeasurementLabel(measurementMatch[1]);
    if (!isLikelyMeasurementLabel(normalizedLabel)) continue;
    const values = (measurementMatch[2].match(/-?\d+(?:\.\d+)?/g) || []).slice(0, sizeValues.length);
    if (values.length < 2) continue;
    rows.push([normalizedLabel, ...values]);
  }
  if (rows.length === 0) return null;

  return standardizeSizeTable({
    headers: ["size", ...sizeValues],
    rows,
  });
};

const extractSizeTableFromPage = ({ html, textBlocks = [], jsonData = null }) => {
  let bestTable = null;
  let bestScore = -1;

  const consider = (table, bonus = 0) => {
    if (!table) return;
    const score = scoreSizeTableCandidate(table);
    if (score < 0) return;
    const weightedScore = score + bonus;
    if (weightedScore > bestScore) {
      bestScore = weightedScore;
      bestTable = table;
    }
  };

  consider(extractSizeTableFromHtmlTables(html), 2);
  consider(extractSizeTableFromJsonData(jsonData), 0);

  for (const block of textBlocks) {
    consider(extractSizeTableFromPlainText(stripHtml(block)), 1);
  }

  consider(extractSizeTableFromPlainText(stripHtml(html)), 1);
  return bestTable;
};

const SIZE_TABLE_GEMINI_PROMPT =
  "Analyze this clothing image and extract a size-table ONLY if a real size chart is visibly present. " +
  "Do not guess or infer missing values. " +
  "If there is no clear size chart table, return empty arrays: {\"headers\":[],\"rows\":[]}. " +
  "When table exists, return JSON only with `headers` and `rows`, and keep every cell as a plain string.";

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

const extractSizeTableWithGemini = async ({ imageBase64, mimeType = "image/png" }) => {
  const normalizedBase64 = String(imageBase64 || "").trim();
  const normalizedMimeType = String(mimeType || "image/png").trim();
  if (!normalizedBase64) {
    return { table: null, error: "imageBase64 is required" };
  }

  assertGeminiKey();

  let lastErrorText = "";
  for (const model of SIZE_TABLE_GEMINI_MODEL_CANDIDATES) {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SIZE_TABLE_GEMINI_PROMPT },
                { inlineData: { mimeType: normalizedMimeType, data: normalizedBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
          },
        }),
      }
    );

    if (!response.ok) {
      lastErrorText = await response.text();
      continue;
    }

    const payload = await response.json();
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    if (candidates.length === 0) {
      lastErrorText = JSON.stringify(payload?.promptFeedback || payload);
      continue;
    }

    const rawText =
      candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";
    if (!rawText) {
      lastErrorText = "Gemini returned empty text";
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      lastErrorText = `Gemini did not return valid JSON: ${rawText.slice(0, 300)}`;
      continue;
    }

    const normalizedTable = standardizeSizeTable(parsed);
    if (normalizedTable) {
      return { table: normalizedTable, error: "" };
    }

    lastErrorText = "Gemini returned empty size-table data";
  }

  return { table: null, error: lastErrorText || "Gemini size-table request failed" };
};

const readPngDimensions = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8);
  if (!signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
};

const readJpegDimensions = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (offset + 4 > buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (!Number.isFinite(length) || length < 2) break;

    const isSofMarker =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSofMarker && offset + 9 < buffer.length) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) return { width, height };
    }

    offset += 2 + length;
  }

  return null;
};

const readWebpDimensions = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    if (!Number.isFinite(chunkSize) || chunkSize < 0) break;
    if (chunkDataOffset + chunkSize > buffer.length) break;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      const width = 1 + buffer.readUIntLE(chunkDataOffset + 4, 3);
      const height = 1 + buffer.readUIntLE(chunkDataOffset + 7, 3);
      if (width > 0 && height > 0) return { width, height };
    }

    if (chunkType === "VP8 " && chunkSize >= 10) {
      const frameTagOffset = chunkDataOffset;
      const startCodeOffset = frameTagOffset + 3;
      if (
        startCodeOffset + 5 < buffer.length &&
        buffer[startCodeOffset] === 0x9d &&
        buffer[startCodeOffset + 1] === 0x01 &&
        buffer[startCodeOffset + 2] === 0x2a
      ) {
        const width = buffer.readUInt16LE(startCodeOffset + 3) & 0x3fff;
        const height = buffer.readUInt16LE(startCodeOffset + 5) & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
      }
    }

    if (chunkType === "VP8L" && chunkSize >= 5) {
      const b0 = buffer[chunkDataOffset + 1];
      const b1 = buffer[chunkDataOffset + 2];
      const b2 = buffer[chunkDataOffset + 3];
      const b3 = buffer[chunkDataOffset + 4];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      if (width > 0 && height > 0) return { width, height };
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
};

const getImageDimensions = (buffer, mimeType) => {
  const normalizedMimeType = String(mimeType || "").toLowerCase();
  if (normalizedMimeType === "image/png") return readPngDimensions(buffer);
  if (normalizedMimeType === "image/jpeg" || normalizedMimeType === "image/jpg") {
    return readJpegDimensions(buffer);
  }
  if (normalizedMimeType === "image/webp") return readWebpDimensions(buffer);

  // Fallback sniffing for mismatched content-type headers.
  return readPngDimensions(buffer) || readJpegDimensions(buffer) || readWebpDimensions(buffer);
};

const downloadImageAsBase64Payload = async (
  imageUrl,
  {
    minBytes = 1,
    maxBytes = PRODUCT_METADATA_MAX_IMAGE_BYTES,
    minWidth = 0,
    minHeight = 0,
    maxAspectRatio = 0,
  } = {}
) => {
  let safeImageUrl = "";
  try {
    safeImageUrl = assertPublicHttpUrl(imageUrl);
  } catch {
    return null;
  }

  const response = await fetchWithTimeout(safeImageUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!response.ok) return null;
  const contentType = String(response.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!contentType.startsWith("image/")) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < Math.max(1, Number(minBytes) || 1)) return null;
  if (buffer.length > Math.max(1, Number(maxBytes) || PRODUCT_METADATA_MAX_IMAGE_BYTES)) return null;
  const dimensions = getImageDimensions(buffer, contentType);

  const normalizedMinWidth = Math.max(0, Number(minWidth) || 0);
  const normalizedMinHeight = Math.max(0, Number(minHeight) || 0);
  const normalizedMaxAspectRatio = Math.max(0, Number(maxAspectRatio) || 0);
  if (normalizedMinWidth > 0 || normalizedMinHeight > 0 || normalizedMaxAspectRatio > 0) {
    if (!dimensions || !dimensions.width || !dimensions.height) return null;
    if (normalizedMinWidth > 0 && dimensions.width < normalizedMinWidth) return null;
    if (normalizedMinHeight > 0 && dimensions.height < normalizedMinHeight) return null;
    if (normalizedMaxAspectRatio > 0) {
      const aspectRatio = Math.max(
        dimensions.width / Math.max(1, dimensions.height),
        dimensions.height / Math.max(1, dimensions.width)
      );
      if (aspectRatio > normalizedMaxAspectRatio) return null;
    }
  }

  return {
    sourceUrl: safeImageUrl,
    mimeType: contentType,
    base64: buffer.toString("base64"),
    byteLength: buffer.length,
    width: dimensions?.width || null,
    height: dimensions?.height || null,
  };
};

const selectFirstImagePayload = async (candidates, excludedCandidates = [], options = {}) => {
  const excluded = new Set(uniqValues(excludedCandidates));
  for (const candidate of uniqValues(candidates)) {
    if (!candidate || excluded.has(candidate)) continue;
    const payload = await downloadImageAsBase64Payload(candidate, options);
    if (payload) return payload;
  }
  return null;
};

const fetchSizeMetadataFromLinkedPage = async (linkedPageUrl) => {
  let safeUrl = "";
  try {
    safeUrl = assertPublicHttpUrl(linkedPageUrl);
  } catch {
    return {
      sizeTable: null,
      sizeChartImageCandidates: [],
      sizeChartPageCandidates: [],
    };
  }

  try {
    const response = await fetchWithTimeout(safeUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    if (!response.ok) {
      return {
        sizeTable: null,
        sizeChartImageCandidates: [],
        sizeChartPageCandidates: [],
      };
    }

    const contentType = String(response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const finalUrl = assertPublicHttpUrl(response.url || safeUrl);
    if (contentType.startsWith("image/")) {
      return {
        sizeTable: null,
        sizeChartImageCandidates: [finalUrl],
        sizeChartPageCandidates: [],
      };
    }
    if (!contentType.includes("text/html")) {
      return {
        sizeTable: null,
        sizeChartImageCandidates: [],
        sizeChartPageCandidates: [],
      };
    }

    const html = await response.text();
    const nextDataPayload = extractNextDataPayload(html);
    const appJsonObjects = extractJsonObjectsFromApplicationScripts(html);
    const combinedJsonData = [nextDataPayload, ...appJsonObjects].filter(Boolean);
    const jsonTextBlocks = collectTextBlocksFromJsonData(combinedJsonData);
    const sizeTable = extractSizeTableFromPage({
      html,
      textBlocks: jsonTextBlocks,
      jsonData: combinedJsonData,
    });
    const jsonImageData = extractImageCandidatesFromJsonData({
      jsonData: combinedJsonData,
      pageUrl: finalUrl,
    });
    const sizeChartImageCandidates = sortSizeChartImageCandidates(addImageResolutionVariants([
      ...(jsonImageData.sizeChartCandidates || []),
      ...extractImageCandidatesFromHtml({
        html,
        pageUrl: finalUrl,
        priorityPattern: /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|measurement|chart|guide|spec|cm)/i,
      }),
    ])).filter((candidate) => isLikelySizeChartImageUrl(candidate));
    const sizeChartPageCandidates = uniqValues([
      ...extractSizeChartPageCandidatesFromJsonData({
        jsonData: combinedJsonData,
        pageUrl: finalUrl,
      }),
      ...extractSizeChartPageCandidatesFromHtml({ html, pageUrl: finalUrl }),
    ]);

    return {
      sizeTable: sizeTable || null,
      sizeChartImageCandidates,
      sizeChartPageCandidates,
    };
  } catch {
    return {
      sizeTable: null,
      sizeChartImageCandidates: [],
      sizeChartPageCandidates: [],
    };
  }
};

const extractProductMetadataFromHtml = ({ html, pageUrl }) => {
  const title = extractHtmlTitle(html);
  const ogTitle = extractMetaContent(html, "og:title", "property");
  const description = extractMetaContent(html, "description", "name");
  const ogImage = normalizeUrlCandidate(pageUrl, extractMetaContent(html, "og:image", "property"));
  const twitterImage = normalizeUrlCandidate(pageUrl, extractMetaContent(html, "twitter:image", "name"));
  const schemaProduct = extractProductJsonLd(html);
  const nextDataPayload = extractNextDataPayload(html);
  const appJsonObjects = extractJsonObjectsFromApplicationScripts(html);
  const musinsaData = extractMusinsaPageData(nextDataPayload);
  const combinedJsonData = [nextDataPayload, ...appJsonObjects].filter(Boolean);
  const jsonImageData = extractImageCandidatesFromJsonData({ jsonData: combinedJsonData, pageUrl });

  const storeBrandFromTitle = normalizeBrandName(String(title || "").split("|").slice(1).join("|"));
  const brand = pickFirstNonEmpty([
    musinsaData?.brand,
    schemaProduct?.brand,
    extractBrandFromDescription(description),
    storeBrandFromTitle,
  ]);

  const schemaName = normalizeCellText(schemaProduct?.name || "");
  const fallbackTitle = pickFirstNonEmpty([ogTitle, title]);
  const name = pickFirstNonEmpty([
    musinsaData?.name,
    schemaName,
    extractProductNameFromTitle(fallbackTitle, brand),
  ]);

  const rawProductImageCandidates = uniqValues([
    ...(musinsaData?.imageCandidates || []).map((candidate) => normalizeUrlCandidate(pageUrl, candidate)),
    ...((schemaProduct?.images || []).map((candidate) => normalizeUrlCandidate(pageUrl, candidate))),
    ...(jsonImageData?.productCandidates || []),
    ogImage,
    twitterImage,
    ...extractProductImageCandidatesFromHtml({
      html,
      pageUrl,
    }),
    ...extractImageCandidatesFromHtml({
      html,
      pageUrl,
      priorityPattern: /(product|goods|detail|prd|item|big|large)/i,
    }),
  ]);
  const productImageCandidates = sortProductImageCandidates(
    rawProductImageCandidates,
    `${brand} ${name}`
  );

  return {
    brand,
    name,
    productImageCandidates,
  };
};
const normalizeProductRow = (row) => {
  if (!row || typeof row !== "object") return null;

  const id = String(row.id || "").trim();
  const brand = String(row.brand || "").trim();
  const name = String(row.name || "").trim();
  const imagePath = String(row.image_path ?? row.imagePath ?? "").trim();
  const image = String(row.image || "").trim();
  if (!id || !brand || !name) return null;

  return {
    id,
    brand,
    name,
    category: String(row.category || "User Uploaded"),
    url: String(row.url || "#"),
    image: image || imagePath,
    imagePath: imagePath || null,
    sizeTable: parseSizeTable(row.size_table ?? row.sizeTable),
    createdAt: row.created_at || row.createdAt || null,
  };
};

const fetchProductsRows = async () => {
  assertSupabaseConfig();

  const queries = [
    () => supabase.from(SUPABASE_PRODUCTS_TABLE).select("*").order("created_at", { ascending: false }),
    () => supabase.from(SUPABASE_PRODUCTS_TABLE).select("*").order("createdAt", { ascending: false }),
    () => supabase.from(SUPABASE_PRODUCTS_TABLE).select("*"),
  ];

  let lastError = null;
  for (const runQuery of queries) {
    const { data, error } = await runQuery();
    if (!error) {
      return Array.isArray(data) ? data : [];
    }
    lastError = error;
  }

  throw new Error(lastError?.message || "failed to fetch products");
};

const normalizeStoragePath = (value) => {
  const path = String(value || "").trim();
  return path || null;
};

const isSubmissionStoragePath = (path) =>
  Boolean(path) &&
  path.startsWith(SUBMISSIONS_STORAGE_PREFIX) &&
  !path.includes("..") &&
  !path.startsWith("http://") &&
  !path.startsWith("https://");

const removeOldProductImageIfUnused = async ({ oldPath, updatedProductId }) => {
  const normalizedOldPath = normalizeStoragePath(oldPath);
  if (!normalizedOldPath || !isSubmissionStoragePath(normalizedOldPath)) return;

  const { count, error: referenceCountError } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("image_path", normalizedOldPath)
    .neq("id", updatedProductId);

  if (referenceCountError) {
    console.error("[admin] failed to check image reference count", {
      path: normalizedOldPath,
      error: referenceCountError.message,
    });
    return;
  }
  if ((count || 0) > 0) return;

  const { error: removeError } = await supabase
    .storage
    .from(SUPABASE_STORAGE_BUCKET)
    .remove([normalizedOldPath]);

  if (removeError) {
    console.error("[admin] failed to remove old image from storage", {
      path: normalizedOldPath,
      error: removeError.message,
    });
  }
};

const insertProductRow = async ({
  brand,
  name,
  category,
  url,
  image,
  imagePath,
  sizeTable,
  createdAt,
}) => {
  assertSupabaseConfig();
  const normalizedImagePath = String(imagePath || "").trim();
  const normalizedImage = String(image || "").trim();
  const effectiveImagePath = normalizedImagePath || normalizedImage || null;
  const effectiveImage = normalizedImage || normalizedImagePath || "";

  const payloads = [
    {
      brand,
      name,
      category,
      url,
      image_path: effectiveImagePath,
      size_table: sizeTable,
      created_at: createdAt,
    },
    {
      brand,
      name,
      category,
      url,
      image_path: effectiveImagePath,
      sizeTable: JSON.stringify(sizeTable),
      createdAt,
    },
    // Legacy schema fallback (uses `image` column)
    {
      brand,
      name,
      category,
      url,
      image: effectiveImage,
      size_table: sizeTable,
      createdAt,
    },
    // Legacy schema fallback (uses `image` column)
    {
      brand,
      name,
      category,
      url,
      image: effectiveImage,
      sizeTable: JSON.stringify(sizeTable),
      created_at: createdAt,
    },
  ];

  let lastError = null;
  for (const payload of payloads) {
    const { data, error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .insert(payload)
      .select("*")
      .single();
    if (!error) {
      return data;
    }
    lastError = error;
  }

  throw new Error(lastError?.message || "failed to insert product");
};

app.post("/api/product-metadata", async (req, res) => {
  const rawUrl = String(req.body?.url || "").trim();

  let pageUrl = "";
  try {
    pageUrl = assertPublicHttpUrl(rawUrl);
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 400;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "invalid url",
    });
  }

  try {
    const preferredPageUrl = normalizePreferredStoreUrl(pageUrl);
    const pageUrlCandidates = uniqValues([
      preferredPageUrl,
      pageUrl,
      toWwwHostUrl(preferredPageUrl),
      toWwwHostUrl(pageUrl),
    ]);

    let pageResponse = null;
    let effectiveRequestedPageUrl = preferredPageUrl || pageUrl;
    let lastFetchDetail = "";

    for (const candidatePageUrl of pageUrlCandidates) {
      if (!candidatePageUrl) continue;
      try {
        const response = await fetchWithTimeout(candidatePageUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "user-agent": "Mozilla/5.0",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        });

        if (!response.ok) {
          lastFetchDetail = `${response.status} ${response.statusText}`;
          continue;
        }

        const responseContentType = String(response.headers.get("content-type") || "").toLowerCase();
        if (!responseContentType.includes("text/html")) {
          lastFetchDetail = `non-html response: ${responseContentType || "unknown content-type"}`;
          continue;
        }

        pageResponse = response;
        effectiveRequestedPageUrl = candidatePageUrl;
        break;
      } catch (error) {
        lastFetchDetail = error?.message || "request failed";
      }
    }

    if (!pageResponse) {
      return res.status(502).json({
        ok: false,
        error: "failed to fetch product page",
        detail: lastFetchDetail || "unknown error",
      });
    }

    const html = await pageResponse.text();
    const finalPageUrl = assertPublicHttpUrl(pageResponse.url || effectiveRequestedPageUrl);
    const extracted = extractProductMetadataFromHtml({
      html,
      pageUrl: finalPageUrl,
    });

    const productImageDownloadOptions = {
      minBytes: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
      minWidth: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
      minHeight: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
      maxAspectRatio: PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
    };

    let productImage = await selectFirstImagePayload(
      extracted.productImageCandidates,
      [],
      productImageDownloadOptions
    );
    if (!productImage) {
      productImage = await selectFirstImagePayload(extracted.productImageCandidates);
    }

    const hasAnyData = Boolean(
      extracted.brand ||
      extracted.name ||
      productImage
    );
    if (!hasAnyData) {
      return res.status(502).json({
        ok: false,
        error: "could not extract product metadata from url",
      });
    }

    return res.json({
      ok: true,
      data: {
        url: finalPageUrl,
        brand: extracted.brand || "",
        name: extracted.name || "",
        productImage: productImage || null,
      },
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "product metadata extraction error",
    });
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const rows = await fetchProductsRows();
    const products = rows
      .map((row) => normalizeProductRow(row))
      .filter((product) => product !== null);

    return res.json({
      ok: true,
      data: { products },
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "products fetch error",
    });
  }
});

app.post("/api/products", async (req, res) => {
  const brand = String(req.body?.brand || "").trim();
  const name = String(req.body?.name || "").trim();
  const category = String(req.body?.category || "User Uploaded").trim();
  const url = String(req.body?.url || "#").trim();
  const imagePath = String(req.body?.image_path ?? req.body?.imagePath ?? "").trim();
  const image = String(req.body?.image || "").trim();
  const sizeTable = parseSizeTable(req.body?.sizeTable ?? null);
  const createdAt = String(req.body?.createdAt || new Date().toISOString()).trim();

  if (!brand || !name) {
    return res.status(400).json({
      ok: false,
      error: "brand and name are required",
    });
  }

  try {
    const insertedRow = await insertProductRow({
      brand,
      name,
      category,
      url,
      image,
      imagePath,
      sizeTable,
      createdAt,
    });
    const product = normalizeProductRow(insertedRow);

    return res.status(201).json({
      ok: true,
      data: { product },
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "product insert error",
    });
  }
});

app.get("/api/admin/session", (req, res) => {
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing in server .env",
    });
  }
  const token = getAdminTokenFromRequest(req);
  const authenticated = verifyAdminSessionToken(token);
  return res.json({
    ok: true,
    data: { authenticated },
  });
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");

  try {
    assertAdminConfig();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "admin config missing",
    });
  }

  if (!safeCompare(password, ADMIN_PASSWORD)) {
    return res.status(401).json({
      ok: false,
      error: "invalid admin credentials",
    });
  }

  const token = makeAdminSessionToken();
  res.setHeader("Set-Cookie", makeAdminCookie(token));
  return res.json({ ok: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearAdminCookie());
  return res.json({ ok: true });
});

app.patch("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  const id = String(req.params?.id || "").trim();
  if (!id) {
    return res.status(400).json({
      ok: false,
      error: "product id is required",
    });
  }

  const payload = {};
  if ("brand" in (req.body || {})) payload.brand = String(req.body?.brand || "").trim();
  if ("name" in (req.body || {})) payload.name = String(req.body?.name || "").trim();
  if ("category" in (req.body || {})) {
    const category = String(req.body?.category || "").trim();
    payload.category = category || null;
  }
  if ("url" in (req.body || {})) {
    const url = String(req.body?.url || "").trim();
    payload.url = url || null;
  }
  if ("imagePath" in (req.body || {})) {
    const imagePath = String(req.body?.imagePath || "").trim();
    payload.image_path = imagePath || null;
  }
  if ("sizeTable" in (req.body || {})) payload.size_table = parseSizeTable(req.body?.sizeTable ?? null);

  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "at least one updatable field is required",
    });
  }
  if ("brand" in payload && !payload.brand) {
    return res.status(400).json({
      ok: false,
      error: "brand cannot be empty",
    });
  }
  if ("name" in payload && !payload.name) {
    return res.status(400).json({
      ok: false,
      error: "name cannot be empty",
    });
  }

  try {
    assertSupabaseConfig();
    const hasImagePathInPayload = Object.prototype.hasOwnProperty.call(payload, "image_path");
    let previousImagePath = null;
    if (hasImagePathInPayload) {
      const { data: existingProduct, error: existingProductError } = await supabase
        .from(SUPABASE_PRODUCTS_TABLE)
        .select("id,image_path")
        .eq("id", id)
        .maybeSingle();

      if (existingProductError) throw existingProductError;
      if (!existingProduct) {
        return res.status(404).json({
          ok: false,
          error: "product not found",
        });
      }
      previousImagePath = normalizeStoragePath(existingProduct.image_path);
    }

    const { data, error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update(payload)
      .eq("id", id)
      .select("id,brand,name,category,url,size_table,created_at,image_path")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        ok: false,
        error: "product not found",
      });
    }

    const currentImagePath = normalizeStoragePath(data.image_path);
    if (hasImagePathInPayload && previousImagePath && previousImagePath !== currentImagePath) {
      await removeOldProductImageIfUnused({
        oldPath: previousImagePath,
        updatedProductId: String(data.id || id),
      });
    }

    return res.json({
      ok: true,
      data: { product: data },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "product update error",
    });
  }
});

app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  const id = String(req.params?.id || "").trim();
  if (!id) {
    return res.status(400).json({
      ok: false,
      error: "product id is required",
    });
  }

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .delete()
      .eq("id", id)
      .select("id,image_path");

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "product not found",
      });
    }

    const deletedProduct = data[0];
    await removeOldProductImageIfUnused({
      oldPath: deletedProduct?.image_path,
      updatedProductId: id,
    });

    return res.json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "product delete error",
    });
  }
});

const assertGeminiKey = () => {
  if (!GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing in server .env");
    error.statusCode = 500;
    throw error;
  }
};

const callGemini = async (model, body) => {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return response;
};

app.post("/api/size-table", async (req, res) => {
  const imageBase64 = String(req.body?.imageBase64 || "").trim();
  const mimeType = String(req.body?.mimeType || "image/png").trim();

  if (!imageBase64) {
    return res.status(400).json({ ok: false, error: "imageBase64 is required" });
  }

  try {
    const result = await extractSizeTableWithGemini({ imageBase64, mimeType });
    const validatedTable = alignAndValidateSizeTableByOptionLabels(result.table, []);
    if (!validatedTable) {
      return res.status(502).json({
        ok: false,
        error: result.error || "Gemini did not return a valid size table",
      });
    }

    return res.json({
      ok: true,
      data: validatedTable,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "size-table error",
    });
  }
});

app.post("/api/remove-bg", async (req, res) => {
  const imageBase64 = String(req.body?.imageBase64 || "").trim();
  const mimeType = String(req.body?.mimeType || "image/png").trim();

  if (!imageBase64) {
    return res.status(400).json({ ok: false, error: "imageBase64 is required" });
  }

  try {
    assertGeminiKey();

    const response = await callGemini("gemini-2.5-flash-image-preview", {
      contents: [
        {
          parts: [
            {
              text:
                "Remove background from this product image. Keep only the product and produce clean output.",
            },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({
        ok: false,
        data: { imageBase64 },
        error: "Gemini remove-bg request failed",
        detail,
      });
    }

    const payload = await response.json();
    const outputBase64 =
      payload?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data)
        ?.inlineData?.data || "";

    if (!outputBase64) {
      return res.status(502).json({
        ok: false,
        data: { imageBase64 },
        error: "Gemini remove-bg returned empty image",
      });
    }

    return res.json({
      ok: true,
      data: { imageBase64: outputBase64 },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      data: { imageBase64 },
      error: error?.message || "remove-bg error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});


