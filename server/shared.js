import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
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
const PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK =
  String(process.env.PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK || "true").toLowerCase() !== "false";
const PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT = Number(
  process.env.PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT || 10
);
const PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT = Number(
  process.env.PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT || 12
);
const PRODUCT_METADATA_SEARCH_RESULT_LIMIT = Number(
  process.env.PRODUCT_METADATA_SEARCH_RESULT_LIMIT || 6
);
const PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS = Number(
  process.env.PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS || 10000
);
const PRODUCT_METADATA_URL_FAST_MODE =
  String(process.env.PRODUCT_METADATA_URL_FAST_MODE || "true").toLowerCase() !== "false";
const BRAND_RULES_FILE_PATH = resolve(process.cwd(), "server", "config", "brand-rules.csv");
const BRAND_RULES_STORAGE_PATH = "_config/brand-rules.json";
const BRAND_RULES_CACHE_TTL_MS = Number(process.env.BRAND_RULES_CACHE_TTL_MS || 15000);
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;
let brandRulesCache = null;
let brandRulesCacheUpdatedAt = 0;
let brandRulesRefreshPromise = null;

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

const DUPLICATE_PRODUCT_ERROR_MESSAGE = "이미 등록된 상품입니다";

const isDuplicateConstraintError = (error) => {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  return (
    code === "23505" ||
    message.includes("duplicate key value") ||
    message.includes("unique constraint") ||
    message.includes("products_unique_key") ||
    details.includes("already exists")
  );
};

const toProductWriteErrorResponse = (error, fallbackMessage) => {
  if (isDuplicateConstraintError(error)) {
    return {
      statusCode: 409,
      message: DUPLICATE_PRODUCT_ERROR_MESSAGE,
    };
  }

  return {
    statusCode: Number(error?.statusCode) || Number(error?.status) || 500,
    message: error?.message || fallbackMessage,
  };
};

const safeCompare = (left, right) => {
  // Hash both sides to fixed length to prevent timing attacks via length leak
  const leftHash = createHash("sha256").update(String(left)).digest();
  const rightHash = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(leftHash, rightHash);
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
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});

const getAdminTokenFromCookieHeader = (cookieHeader = "") => {
  const cookies = parseCookies(String(cookieHeader || ""));
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
  "\uC18C\uB9E4\uAE30\uC7A5": "\uC18C\uB9E4",
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
  if (aliasKey.includes("shoulder") || aliasKey.includes("\uC5B4\uAE68")) return "\uC5B4\uAE68";
  if (aliasKey.includes("chest") || aliasKey.includes("bust") || aliasKey.includes("bodywidth") || aliasKey.includes("pit") || aliasKey.includes("\uAC00\uC2B4") || aliasKey.includes("\uD488")) {
    return "\uAC00\uC2B4";
  }
  if (aliasKey.includes("sleeve") || aliasKey.includes("arm") || aliasKey.includes("\uC18C\uB9E4") || aliasKey.includes("\uD654\uC7A5")) return "\uC18C\uB9E4";
  if (aliasKey.includes("waist") || aliasKey.includes("\uD5C8\uB9AC")) return "\uD5C8\uB9AC";
  if (aliasKey.includes("hip") || aliasKey.includes("\uC5C9\uB369\uC774") || aliasKey.includes("\uD799")) return "\uC5C9\uB369\uC774";
  if (aliasKey.includes("thigh") || aliasKey.includes("\uD5C8\uBC85\uC9C0")) return "\uD5C8\uBC85\uC9C0";
  if (aliasKey.includes("rise") || aliasKey.includes("\uBC11\uC704")) return "\uBC11\uC704";
  if (aliasKey.includes("hem") || aliasKey.includes("\uBC11\uB2E8")) return "\uBC11\uB2E8";
  if (aliasKey.includes("inseam") || aliasKey.includes("\uC778\uC2EC")) return "\uC778\uC2EC";
  return "";
};

const normalizeMeasurementLabel = (value) => {
  const raw = normalizeCellText(value);
  if (!raw) return "";
  const sanitizedRaw = raw.replace(/^(?:cm|mm|in(?:ch)?)\s+/i, "");
  const aliasKey = normalizeAliasKey(sanitizedRaw);
  if (MEASUREMENT_ALIAS_MAP[aliasKey]) return MEASUREMENT_ALIAS_MAP[aliasKey];
  const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
  if (inferred) return inferred;
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return sanitizedRaw;
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

const parseDelimitedLine = (line, delimiter = ",") => {
  const output = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      output.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  output.push(current);
  return output.map((value) => String(value || "").trim());
};

const parseBrandRulesCsv = (raw) => {
  const lines = String(raw || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes("\t") && !lines[0].includes(",") ? "\t" : ",";
  const header = parseDelimitedLine(lines[0], delimiter).map((value) => value.toLowerCase());
  const matchTypeIndex = header.indexOf("match_type");
  const matchValueIndex = header.indexOf("match_value");
  const canonicalBrandIndex = header.indexOf("canonical_brand");
  if (matchTypeIndex < 0 || matchValueIndex < 0 || canonicalBrandIndex < 0) return [];

  return lines
    .slice(1)
    .map((line) => parseDelimitedLine(line, delimiter))
    .map((columns) => ({
      matchType: String(columns[matchTypeIndex] || "").trim().toLowerCase(),
      matchValue: String(columns[matchValueIndex] || "").trim(),
      canonicalBrand: String(columns[canonicalBrandIndex] || "").trim(),
    }))
    .filter((rule) => rule.matchType && rule.matchValue && rule.canonicalBrand);
};

const readBrandRulesFile = () => {
  try {
    if (!existsSync(BRAND_RULES_FILE_PATH)) return [];
    return parseBrandRulesCsv(readFileSync(BRAND_RULES_FILE_PATH, "utf8"));
  } catch (error) {
    console.error("[brand-rules] failed to read brand rules csv", error);
    return [];
  }
};

const setBrandRulesCache = (rules) => {
  brandRulesCache = Array.isArray(rules) ? rules : [];
  brandRulesCacheUpdatedAt = Date.now();
  return brandRulesCache;
};

const getBrandRules = () => {
  if (Array.isArray(brandRulesCache)) return brandRulesCache;
  return setBrandRulesCache(readBrandRulesFile());
};

const escapeCsvCell = (value) => {
  const normalized = String(value ?? "");
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
};

const normalizeBrandRuleText = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

const VALID_BRAND_RULE_TYPES = new Set(["domain", "url", "brand", "brand_contains"]);

const normalizeHostName = (value) => {
  const raw = normalizeCellText(value).toLowerCase();
  if (!raw) return "";

  try {
    const parsed = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
};

const normalizeBrandNameBase = (value) =>
  normalizeCellText(value)
    .replace(/\s*온라인\s*스토어\s*공식몰$/i, "")
    .replace(/\s*온라인\s*공식몰$/i, "")
    .replace(/\s*공식\s*스토어$/i, "")
    .replace(/\s*official\s+online\s+store$/i, "")
    .replace(/\s*official\s+store$/i, "")
    .trim();

const normalizeBrandRule = (rule) => {
  if (!rule || typeof rule !== "object") return null;

  const matchType = String(rule.matchType || "").trim().toLowerCase();
  const matchValue = String(rule.matchValue || "").trim();
  const canonicalBrand = String(rule.canonicalBrand || "").trim();
  if (!VALID_BRAND_RULE_TYPES.has(matchType) || !matchValue || !canonicalBrand) {
    return null;
  }

  return {
    matchType,
    matchValue,
    canonicalBrand: normalizeBrandNameBase(canonicalBrand),
  };
};

const serializeBrandRulesCsv = (rules) => {
  const normalizedRules = Array.isArray(rules)
    ? rules.map((rule) => normalizeBrandRule(rule)).filter(Boolean)
    : [];
  const lines = [
    "match_type,match_value,canonical_brand",
    ...normalizedRules.map((rule) =>
      [rule.matchType, rule.matchValue, rule.canonicalBrand].map(escapeCsvCell).join(",")
    ),
  ];
  return `${lines.join("\n")}\n`;
};

const parseBrandRulesStoragePayload = (raw) => {
  try {
    const parsed = JSON.parse(String(raw || ""));
    const rules = Array.isArray(parsed?.rules) ? parsed.rules : [];
    return rules.map((rule) => normalizeBrandRule(rule)).filter(Boolean);
  } catch (error) {
    console.error("[brand-rules] failed to parse storage payload", error);
    return null;
  }
};

const loadBrandRulesFromStorage = async () => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_STORAGE_BUCKET)
      .download(BRAND_RULES_STORAGE_PATH);
    if (error) {
      const message = String(error.message || "").toLowerCase();
      const statusCode = Number(error.statusCode || error.status || 0);
      if (statusCode === 404 || message.includes("not found") || message.includes("object not found")) {
        return null;
      }
      console.error("[brand-rules] failed to download rules from storage", error);
      return null;
    }

    const raw = typeof data?.text === "function" ? await data.text() : "";
    const parsedRules = parseBrandRulesStoragePayload(raw);
    return Array.isArray(parsedRules) ? parsedRules : null;
  } catch (error) {
    console.error("[brand-rules] unexpected storage read error", error);
    return null;
  }
};

const persistBrandRulesToStorage = async (rules) => {
  assertSupabaseConfig();

  const normalizedRules = Array.isArray(rules)
    ? rules.map((rule) => normalizeBrandRule(rule)).filter(Boolean)
    : [];
  const payload = JSON.stringify({ rules: normalizedRules }, null, 2);
  const { error } = await supabase
    .storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(BRAND_RULES_STORAGE_PATH, new Blob([payload], { type: "application/json; charset=utf-8" }), {
      upsert: true,
      contentType: "application/json; charset=utf-8",
      cacheControl: "0",
    });
  if (error) throw error;
  return normalizedRules;
};

const refreshBrandRulesCache = async ({ force = false } = {}) => {
  const hasFreshCache =
    Array.isArray(brandRulesCache) &&
    brandRulesCacheUpdatedAt > 0 &&
    Date.now() - brandRulesCacheUpdatedAt < BRAND_RULES_CACHE_TTL_MS;
  if (!force && hasFreshCache) {
    return brandRulesCache;
  }
  if (brandRulesRefreshPromise) {
    return brandRulesRefreshPromise;
  }

  brandRulesRefreshPromise = (async () => {
    const storageRules = await loadBrandRulesFromStorage();
    if (Array.isArray(storageRules)) {
      return setBrandRulesCache(storageRules);
    }
    return setBrandRulesCache(readBrandRulesFile());
  })();

  try {
    return await brandRulesRefreshPromise;
  } finally {
    brandRulesRefreshPromise = null;
  }
};

const writeBrandRules = async (rules) => {
  const normalizedRules = await persistBrandRulesToStorage(rules);
  const csv = serializeBrandRulesCsv(normalizedRules);

  try {
    writeFileSync(BRAND_RULES_FILE_PATH, csv, "utf8");
  } catch (error) {
    console.warn("[brand-rules] local csv sync skipped", error?.message || error);
  }

  return setBrandRulesCache(normalizedRules);
};

const applyBrandRule = ({ brand = "", url = "" }) => {
  const normalizedBrand = normalizeBrandNameBase(brand);
  const normalizedBrandKey = normalizeBrandRuleText(normalizedBrand);
  const normalizedUrl = normalizeCellText(url).toLowerCase();
  const normalizedHost = normalizeHostName(url);

  for (const rule of getBrandRules()) {
    const ruleType = String(rule.matchType || "").toLowerCase();
    const canonicalBrand = normalizeBrandNameBase(rule.canonicalBrand || "");
    if (!canonicalBrand) continue;

    if (ruleType === "domain") {
      const ruleHost = normalizeHostName(rule.matchValue);
      if (ruleHost && (normalizedHost === ruleHost || normalizedHost.endsWith(`.${ruleHost}`))) {
        return canonicalBrand;
      }
      continue;
    }

    if (ruleType === "url") {
      const ruleUrl = normalizeCellText(rule.matchValue).toLowerCase();
      if (ruleUrl && normalizedUrl.includes(ruleUrl)) {
        return canonicalBrand;
      }
      continue;
    }

    if (ruleType === "brand") {
      if (normalizedBrandKey && normalizedBrandKey === normalizeBrandRuleText(rule.matchValue)) {
        return canonicalBrand;
      }
      continue;
    }

    if (ruleType === "brand_contains") {
      const ruleBrandPart = normalizeBrandRuleText(rule.matchValue);
      if (ruleBrandPart && normalizedBrandKey.includes(ruleBrandPart)) {
        return canonicalBrand;
      }
    }
  }

  return normalizedBrand;
};

const normalizeBrandName = (value, context = {}) =>
  applyBrandRule({
    brand: value,
    url: context?.url || "",
  });

const ALLOWED_PRODUCT_CATEGORIES = ["outer", "top", "bottom", "shoes", "acc"];
const PRODUCT_CATEGORY_PATTERNS = [
  { category: "outer", pattern: /(?:outer|coat|jacket|blazer|cardigan|padding|parka|windbreaker)/i },
  { category: "top", pattern: /(?:top|tee|t-shirt|shirt|knit|sweater|hoodie|sweatshirt)/i },
  { category: "bottom", pattern: /(?:bottom|pants|trouser|jean|denim|slacks|skirt|shorts)/i },
  { category: "shoes", pattern: /(?:shoes|sneaker|loafer|boots?|heel|sandals?)/i },
  { category: "acc", pattern: /(?:acc|accessory|bag|belt|cap|hat|wallet|earring|necklace|bracelet|scarf)/i },
];

const normalizeProductCategory = (value) => {
  const normalized = normalizeCellText(value).toLowerCase();
  if (!normalized) return "";
  if (ALLOWED_PRODUCT_CATEGORIES.includes(normalized)) return normalized;
  for (const entry of PRODUCT_CATEGORY_PATTERNS) {
    if (entry.pattern.test(normalized)) return entry.category;
  }
  return "";
};

const inferProductCategory = (...texts) => {
  for (const text of texts) {
    const inferred = normalizeProductCategory(text);
    if (inferred) return inferred;
  }
  return "";
};

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

const extractSearchResultUrls = (html, baseUrl) => {
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

const scoreProductPageSearchCandidate = (urlValue, { brand = "", name = "" } = {}) => {
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

const buildProductSearchQueries = ({ brand = "", name = "", category = "" }) => {
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
const PRODUCT_IMAGE_TRACKING_HOST_PATTERN =
  /(?:^|\.)facebook\.com$|(?:^|\.)connect\.facebook\.net$|(?:^|\.)google-analytics\.com$|(?:^|\.)googletagmanager\.com$|(?:^|\.)doubleclick\.net$/i;
const PRODUCT_IMAGE_TRACKING_PATH_PATTERN =
  /(?:^|\/)(?:tr|collect|pixel|analytics)(?:\/|$)/i;
const PRODUCT_IMAGE_ALLOW_PATH_HINT_PATTERN =
  /(?:\/web\/product\/|\/goods_img\/|\/prd_img\/|\/product\/|\/images?\/|\/img\/|\/upload\/)/i;
const PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN =
  /(?:look|model|wear|coordi|campaign|editorial|style|outfit|fitview|snap)/i;
const PRODUCT_IMAGE_POSITIVE_HINT_PATTERN =
  /(?:product|goods|item|prd|main|front|cover|thumbnail|thumb|image|photo|zoom|large|big|\uC0C1\uD488|\uB300\uD45C|\uBA54\uC778)/i;
const PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN =
  /(?:logo|icon|banner|sprite|avatar|profile|review|event|lookbook|campaign|editorial|video|youtube|swatch|colorchip|watermark|model|detail-cut|detailcut|\uB85C\uACE0|\uC544\uC774\uCF58|\uBC30\uB108|\uB9AC\uBDF0|\uB8E9\uBD81|\uBAA8\uB378)/i;
const PRODUCT_IMAGE_SELECTION_LIMIT = Math.max(
  8,
  Number(process.env.PRODUCT_METADATA_PRODUCT_IMAGE_SELECTION_LIMIT) || 24
);
const PRODUCT_IMAGE_VALIDATION_LIMIT = Math.max(
  4,
  Math.min(
    PRODUCT_IMAGE_SELECTION_LIMIT,
    Number(process.env.PRODUCT_METADATA_PRODUCT_IMAGE_VALIDATION_LIMIT) || 8
  )
);

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

const isLikelyProductImageUrl = (url) => {
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
  if (/\/web\/product\/medium\//i.test(pathname)) score -= 6;
  if (/(?:^|[_\-/.])(main|front|cover|represent|thumb0?1)(?:[_\-/.]|$)/i.test(fileName)) score += 8;
  if (/(?:big|large|zoom|origin|original|xlarge)/i.test(hint)) score += 3;
  if (/(?:^|[_\-/.])(front|main|cover|represent)(?:[_\-/.]|$)/i.test(hint)) score += 5;
  if (/(?:product[-_\s]?only|flat|laid[-\s]?flat|packshot|still[-\s]?life)/i.test(hint)) score += 14;
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
  if (/(?:^|[_\-/.])(detail|sub|model|look|coordi|back|rear|side)(?:[_\-/.]|$)/i.test(fileName)) score -= 18;
  if (PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname)) score -= 30;

  if (PRODUCT_IMAGE_NEGATIVE_HINT_PATTERN.test(hint)) score -= 18;
  if (/(?:person|human|wearing|착용|모델|룩북|lookbook|outfit|styling|coordi)/i.test(hint)) score -= 24;
  if (/(?:back|rear|side|profile)/i.test(hint)) score -= 14;
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

const sortProductImageCandidates = (candidates, hintText = "", sourceBonusByUrl = null) => {
  const scored = uniqValues(candidates).map((candidate) => ({
    url: candidate,
    score:
      scoreProductImageCandidate(candidate, hintText) +
      Number(sourceBonusByUrl?.get(candidate) || 0),
  }));
  return scored
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.url);
};

const isModelLikeProductImageCandidate = (url, hintText = "") => {
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
  return /(?:person|human|wearing|lookbook|outfit|styling|coordi|착용|모델|룩북)/i.test(hint);
};

const isStrongProductOnlyProductImageCandidate = (url, hintText = "") => {
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
    Math.min(
      normalizedCandidates.length,
      Number(PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT) || 12
    )
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

const shouldSkipGeminiImageRerank = (candidateUrls, hintText = "") => {
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

const prioritizeProductImageCandidates = async ({
  primaryImage = null,
  candidates = [],
  brand = "",
  name = "",
  sourceBonusByUrl = null,
  fastMode = false,
}) => {
  const metadataHint = `${brand || ""} ${name || ""}`.trim();
  const mergedProductImageCandidates = sortProductImageCandidates(
    addImageResolutionVariants([
      primaryImage?.sourceUrl || "",
      ...(Array.isArray(candidates) ? candidates : []),
    ]).filter((candidate) => isLikelyProductImageUrl(candidate)),
    metadataHint,
    sourceBonusByUrl
  );
  const coreProductPathPattern = /(?:\/web\/product\/|\/goods_img\/|\/prd_img\/)/i;
  const likelyProductImageCandidates = mergedProductImageCandidates.filter(
    (candidate) => scoreProductImageCandidate(candidate, metadataHint) >= 0
  );
  const coreLikelyCandidates = likelyProductImageCandidates.filter((candidate) =>
    coreProductPathPattern.test(String(candidate || ""))
  );
  const baseLikelyCandidates =
    coreLikelyCandidates.length > 0 ? coreLikelyCandidates : likelyProductImageCandidates;
  const mergedCoreCandidates = mergedProductImageCandidates.filter((candidate) =>
    coreProductPathPattern.test(String(candidate || ""))
  );
  const baseMergedCandidates =
    coreLikelyCandidates.length > 0 ? mergedCoreCandidates : mergedProductImageCandidates;

  const isExtraProductPath = (candidate) =>
    /\/web\/product\/extra\//i.test(String(candidate || ""));
  const isSmallProductPath = (candidate) =>
    /\/web\/product\/small\//i.test(String(candidate || ""));

  const mergedNonExtraCandidates = baseMergedCandidates.filter(
    (candidate) => !isExtraProductPath(candidate)
  );
  const nonExtraLikelyCandidates = baseLikelyCandidates.filter(
    (candidate) => !isExtraProductPath(candidate)
  );
  const primaryLikelyCandidates = nonExtraLikelyCandidates.filter(
    (candidate) => !isSmallProductPath(candidate)
  );
  const smallLikelyCandidates = nonExtraLikelyCandidates.filter((candidate) =>
    isSmallProductPath(candidate)
  );
  const extraLikelyCandidates = baseLikelyCandidates.filter((candidate) =>
    isExtraProductPath(candidate)
  );
  const fallbackLikelyCandidates = baseLikelyCandidates;
  const fallbackMergedCandidates =
    mergedNonExtraCandidates.length > 0 ? mergedNonExtraCandidates : baseMergedCandidates;

  const prioritizedCandidates = uniqValues([
    ...primaryLikelyCandidates,
    ...smallLikelyCandidates,
    ...extraLikelyCandidates,
    ...fallbackLikelyCandidates,
    ...fallbackMergedCandidates,
  ]);
  const validationLimit = fastMode
    ? Math.max(2, Math.min(3, PRODUCT_IMAGE_VALIDATION_LIMIT))
    : PRODUCT_IMAGE_VALIDATION_LIMIT;
  const validationProbeLimit = fastMode
    ? Math.max(4, validationLimit * 2)
    : Math.max(12, validationLimit * 2);
  const validatedPrimary = await selectTopUsableImageUrls(prioritizedCandidates, {
    excludedCandidates: [primaryImage?.sourceUrl || ""],
    excludedContentHashes: [primaryImage?.contentHash || ""],
    limit: validationLimit,
    maxProbeCount: validationProbeLimit,
    minBytes: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
    maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
    minWidth: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
    minHeight: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
    maxAspectRatio: Math.min(PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2, 2.8),
  });
  const validatedSecondary =
    validatedPrimary.urls.length >= validationLimit
      ? { urls: [], contentHashes: [] }
      : await selectTopUsableImageUrls(prioritizedCandidates, {
          excludedCandidates: [
            primaryImage?.sourceUrl || "",
            ...validatedPrimary.urls,
          ],
          excludedContentHashes: [
            primaryImage?.contentHash || "",
            ...validatedPrimary.contentHashes,
          ],
          limit: Math.max(1, validationLimit - validatedPrimary.urls.length),
          maxProbeCount: validationProbeLimit,
          minBytes: Math.max(1024, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES / 2),
          maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
          minWidth: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH / 2),
          minHeight: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT / 2),
          maxAspectRatio: Math.max(
            2.8,
            PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2
          ),
        });
  const validatedProductImageCandidates = uniqValues([
    ...validatedPrimary.urls,
    ...validatedSecondary.urls,
  ]);
  const heuristicCandidatePool = uniqValues([
    primaryImage?.sourceUrl || "",
    ...validatedProductImageCandidates,
    ...prioritizedCandidates,
  ]).filter(Boolean);
  const candidateSeedForRanking = fastMode
    ? heuristicCandidatePool.slice(0, Math.max(validationLimit, 6))
    : buildProductImageGeminiShortlist(heuristicCandidatePool, metadataHint);
  const rerankedProductImageCandidates = fastMode
    ? candidateSeedForRanking
    : shouldSkipGeminiImageRerank(candidateSeedForRanking, metadataHint)
      ? candidateSeedForRanking
      : await rerankProductImageCandidatesByModelVisibility(candidateSeedForRanking, {
          brand,
          name,
        });
  const combinedProductImageCandidates = uniqValues([
    ...rerankedProductImageCandidates,
    ...validatedProductImageCandidates,
    ...prioritizedCandidates,
  ]);
  const nonModelProductImageCandidates = combinedProductImageCandidates.filter(
    (candidate) => !isModelLikeProductImageCandidate(candidate, metadataHint)
  );
  const modelLikeProductImageCandidates = combinedProductImageCandidates.filter((candidate) =>
    isModelLikeProductImageCandidate(candidate, metadataHint)
  );
  const productImageCandidates = (
    nonModelProductImageCandidates.length > 0
      ? [...nonModelProductImageCandidates, ...modelLikeProductImageCandidates]
      : combinedProductImageCandidates
  ).slice(0, PRODUCT_IMAGE_SELECTION_LIMIT);
  const imagePath = pickFirstNonEmpty([
    ...productImageCandidates,
    primaryImage?.sourceUrl || "",
  ]);

  return {
    imagePath,
    productImageCandidates,
  };
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
  if (table.headers.length < 2 || table.rows.length < 1) return false;

  const normalizedRows = table.rows
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => row.length > 0);
  if (normalizedRows.length < 1) return false;

  const measurementLikeRows = normalizedRows.filter((row) =>
    isLikelyMeasurementLabelLoose(row?.[0] || "") || isLikelyMeasurementKey(row?.[0] || "")
  ).length;
  const descriptiveRowHeaders = normalizedRows.filter((row) => {
    const headerCell = normalizeCellText(row?.[0] || "");
    if (!headerCell) return false;
    if (isLikelyMeasurementLabelLoose(headerCell) || isLikelyMeasurementKey(headerCell)) return true;
    if (isLikelySizeLabel(headerCell)) return false;
    if (parseNumericCellValue(headerCell) !== null) return false;
    return true;
  }).length;
  if (measurementLikeRows < 1 && descriptiveRowHeaders < 1) return false;

  let numericCells = 0;
  for (const row of normalizedRows) {
    for (const cell of row.slice(1)) {
      if (parseNumericCellValue(cell) !== null) numericCells += 1;
    }
  }
  const expectedValueColumns = Math.max(1, table.headers.length - 1);
  const minimumNumericCells = Math.max(1, Math.min(4, expectedValueColumns));
  if (numericCells < minimumNumericCells) return false;
  return true;
};

const pickUsableSizeTableOrientation = (table) => {
  if (!table) return null;
  if (hasUsableSizeTableShape(table)) return table;
  const transposed = transposeTable(table);
  if (hasUsableSizeTableShape(transposed)) return transposed;
  return null;
};

const alignAndValidateSizeTableByOptionLabels = (table, optionSizeLabels = []) => {
  if (!table) return null;
  const usableTable = pickUsableSizeTableOrientation(table);
  if (!usableTable) return null;

  const normalizedOptions = uniqValues(
    (optionSizeLabels || [])
      .map((value) => normalizeComparableSizeLabel(value))
      .filter((value) => isLikelySizeLabel(value))
  );
  if (normalizedOptions.length < 2) return usableTable;

  const normalizedHeaders = usableTable.headers
    .slice(1)
    .map((value) => normalizeComparableSizeLabel(value))
    .filter(Boolean);
  if (normalizedHeaders.length < 2) return null;

  const shouldReplaceHeaders =
    areSequentialNumericSizeHeaders(normalizedHeaders) &&
    normalizedOptions.length === normalizedHeaders.length;
  if (shouldReplaceHeaders) {
    return {
      headers: [usableTable.headers[0] || ITEM_LABEL, ...normalizedOptions],
      rows: usableTable.rows,
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
    const projectedHeaders = [usableTable.headers[0] || ITEM_LABEL, ...matchedOptionsInOrder];
    const projectedRows = usableTable.rows.map((row) => [
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
  return usableTable;
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
  return /-?\d+(?:\.\d+)?/.test(cleaned);
};

const parseNumericCellValue = (value) => {
  const text = normalizeCellText(value).toLowerCase();
  if (!text) return null;
  const cleaned = text
    .replace(/,/g, "")
    .replace(/\b(cm|mm|in|inch|kg|g|oz)\b/g, "")
    .replace(/\s+/g, "");
  const tokenMatch = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!tokenMatch?.[0]) return null;
  const numeric = Number(tokenMatch[0]);
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

const SIZE_TABLE_GEMINI_PROMPT_PRIMARY =
  "Analyze this clothing image and extract a size table when size information is visible. " +
  "Valid inputs include both grid tables and list-style blocks (for example: M: 총장 62cm, 가슴 57cm ...). " +
  "Normalize into JSON with `headers` and `rows` only. " +
  "Prefer a matrix where headers are [항목, size1, size2, ...] and rows are measurement items. " +
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
    category: {
      type: "STRING",
    },
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

const extractSizeTableWithGemini = async ({ imageBase64, mimeType = "image/png" }) => {
  const normalizedBase64 = String(imageBase64 || "").trim();
  const normalizedMimeType = String(mimeType || "image/png").trim();
  if (!normalizedBase64) {
    return { table: null, error: "imageBase64 is required" };
  }

  assertGeminiKey();

  let lastErrorText = "";
  for (const model of SIZE_TABLE_GEMINI_MODEL_CANDIDATES) {
    for (const prompt of SIZE_TABLE_GEMINI_PROMPT_CANDIDATES) {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
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
  }

  return { table: null, error: lastErrorText || "Gemini size-table request failed" };
};

const assessProductImageWithGemini = async ({
  imageBase64,
  mimeType = "image/jpeg",
  brand = "",
  name = "",
}) => {
  const normalizedBase64 = String(imageBase64 || "").trim();
  const normalizedMimeType = String(mimeType || "image/jpeg").trim();
  if (!normalizedBase64) return null;
  if (!GEMINI_API_KEY) return null;
  if (!PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK) return null;

  const productHint = normalizeCellText(`${brand} ${name}`).trim();
  let lastErrorText = "";

  for (const model of PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES) {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: productHint
                    ? `${PRODUCT_IMAGE_GEMINI_PROMPT} Product hint: ${productHint}`
                    : PRODUCT_IMAGE_GEMINI_PROMPT,
                },
                { inlineData: { mimeType: normalizedMimeType, data: normalizedBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA,
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
      lastErrorText = "Gemini returned empty image assessment";
      continue;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      lastErrorText = `Gemini did not return valid JSON: ${rawText.slice(0, 200)}`;
      continue;
    }

    const normalized = normalizeProductImageGeminiAssessment(parsed);
    if (normalized) return normalized;
    lastErrorText = "Gemini image assessment normalization failed";
  }

  return null;
};

const extractProductMetadataFromImageWithGemini = async ({
  imageBase64,
  mimeType = "image/png",
}) => {
  const normalizedBase64 = String(imageBase64 || "").trim();
  const normalizedMimeType = String(mimeType || "image/png").trim();
  if (!normalizedBase64) {
    return { data: null, error: "imageBase64 is required" };
  }

  assertGeminiKey();

  let lastErrorText = "";
  for (const model of SIZE_TABLE_GEMINI_MODEL_CANDIDATES) {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT },
                { inlineData: { mimeType: normalizedMimeType, data: normalizedBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA,
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
      lastErrorText = "Gemini returned empty metadata text";
      continue;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      lastErrorText = `Gemini did not return valid JSON: ${rawText.slice(0, 300)}`;
      continue;
    }

    const category = normalizeProductCategory(parsed?.category || "");
    const brand = normalizeCellText(parsed?.brand || "");
    const name = normalizeCellText(parsed?.name || "");
    let url = normalizeCellText(parsed?.url || "");
    let imagePath = normalizeCellText(parsed?.image_path || "");

    try {
      url = url ? assertPublicHttpUrl(url) : "";
    } catch {
      url = "";
    }
    try {
      imagePath = imagePath ? assertPublicHttpUrl(imagePath) : "";
    } catch {
      imagePath = "";
    }

    const parsedTable = parsed?.size_table || parsed?.sizeTable || null;
    const normalizedTable = standardizeSizeTable(parsedTable);
    const productImageBbox = normalizeCaptureBoundingBox(
      parsed?.product_image_bbox || parsed?.productImageBbox || null
    );
    const sizeChartBbox = normalizeCaptureBoundingBox(
      parsed?.size_chart_bbox || parsed?.sizeChartBbox || null
    );

    return {
      data: {
        brand,
        name,
        category,
        url,
        image_path: imagePath,
        product_image_bbox: productImageBbox,
        size_chart_bbox: sizeChartBbox,
        sizeTable: normalizedTable,
      },
      error: "",
    };
  }

  return { data: null, error: lastErrorText || "Gemini metadata extraction failed" };
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
    includeBase64 = true,
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
    base64: includeBase64 ? buffer.toString("base64") : null,
    byteLength: buffer.length,
    width: dimensions?.width || null,
    height: dimensions?.height || null,
    contentHash: createHash("sha1").update(buffer).digest("hex"),
  };
};

const selectTopUsableImageUrls = async (
  candidates,
  {
    excludedCandidates = [],
    excludedContentHashes = [],
    limit = 4,
    maxProbeCount = 16,
    minBytes = 1,
    maxBytes = PRODUCT_METADATA_MAX_IMAGE_BYTES,
    minWidth = 0,
    minHeight = 0,
    maxAspectRatio = 0,
  } = {}
) => {
  const selected = [];
  const excluded = new Set(uniqValues(excludedCandidates));
  const seenContentHashes = new Set(
    uniqValues(excludedContentHashes)
      .map((value) => normalizeCellText(value).toLowerCase())
      .filter(Boolean)
  );
  const selectedContentHashes = new Set();
  let probed = 0;

  for (const candidate of uniqValues(candidates)) {
    if (!candidate || excluded.has(candidate)) continue;
    if (selected.length >= Math.max(1, Number(limit) || 1)) break;
    if (probed >= Math.max(1, Number(maxProbeCount) || 1)) break;
    probed += 1;

    const payload = await downloadImageAsBase64Payload(candidate, {
      minBytes,
      maxBytes,
      minWidth,
      minHeight,
      maxAspectRatio,
      includeBase64: false,
    });
    if (!payload?.sourceUrl) continue;
    const contentHash = normalizeCellText(payload.contentHash || "").toLowerCase();
    if (contentHash && seenContentHashes.has(contentHash)) continue;
    if (contentHash) {
      seenContentHashes.add(contentHash);
      selectedContentHashes.add(contentHash);
    }
    selected.push(payload.sourceUrl);
  }

  return {
    urls: selected,
    contentHashes: [...selectedContentHashes],
  };
};

const rerankProductImageCandidatesByModelVisibility = async (
  candidateUrls,
  { brand = "", name = "" } = {}
) => {
  const normalizedCandidates = uniqValues(candidateUrls);
  if (!PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK) return normalizedCandidates;
  if (!GEMINI_API_KEY) return normalizedCandidates;
  if (normalizedCandidates.length <= 1) return normalizedCandidates;

  const limit = Math.max(
    1,
    Math.min(
      Math.max(
        Number(PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT) || 6,
        Number(PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT) || 12
      ),
      Number(PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES) || 10,
      normalizedCandidates.length
    )
  );

  const assessed = [];
  for (const candidate of normalizedCandidates.slice(0, limit)) {
    let payload = null;
    try {
      payload = await downloadImageAsBase64Payload(candidate, {
        minBytes: Math.max(1024, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES / 2),
        maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
        minWidth: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH / 2),
        minHeight: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT / 2),
        maxAspectRatio: Math.max(2.8, PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2),
        includeBase64: true,
      });
    } catch {
      payload = null;
    }
    if (!payload?.base64) continue;

    const assessment = await assessProductImageWithGemini({
      imageBase64: payload.base64,
      mimeType: payload.mimeType || "image/jpeg",
      brand,
      name,
    });
    if (!assessment) continue;

    let score = Number(assessment.productOnlyScore) || 0;
    const pathLower = (() => {
      try {
        return String(new URL(candidate).pathname || "").toLowerCase();
      } catch {
        return "";
      }
    })();
    if (/\/web\/product\/big\//i.test(pathLower)) score += 10;
    else if (/\/web\/product\/medium\//i.test(pathLower)) score += 7;
    else if (/\/goods_img\//i.test(pathLower)) score += 6;
    else if (/\/prd_img\//i.test(pathLower)) score += 2;
    if (/\/web\/product\/small\//i.test(pathLower)) score -= 6;
    if (/\/web\/product\/extra\//i.test(pathLower)) score -= 14;
    if (PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathLower)) score -= 28;
    if (isStrongProductOnlyProductImageCandidate(candidate, `${brand} ${name}`)) score += 12;

    if (assessment.hasVisiblePerson) {
      if (assessment.personArea === "large") score -= 70;
      else if (assessment.personArea === "medium") score -= 50;
      else if (assessment.personArea === "small") score -= 30;
      else score -= 24;
    } else {
      score += 24;
    }
    score += Math.round((Number(assessment.frontViewScore) || 0) * 0.5);

    assessed.push({
      url: candidate,
      score,
      hasVisiblePerson: assessment.hasVisiblePerson,
      personArea: assessment.personArea,
      frontViewScore: assessment.frontViewScore,
    });
  }

  if (assessed.length === 0) return normalizedCandidates;
  const assessedByUrl = new Map(assessed.map((entry) => [entry.url, entry]));
  const hasPersonFreeCandidate = assessed.some((entry) => !entry.hasVisiblePerson);
  const assessedForSorting = hasPersonFreeCandidate
    ? assessed.filter((entry) => !entry.hasVisiblePerson)
    : assessed;

  const sortedAssessedUrls = assessedForSorting
    .slice()
    .sort((left, right) => {
      if (hasPersonFreeCandidate && left.hasVisiblePerson !== right.hasVisiblePerson) {
        return left.hasVisiblePerson ? 1 : -1;
      }
      if (right.score !== left.score) return right.score - left.score;
      if ((right.frontViewScore || 0) !== (left.frontViewScore || 0)) {
        return (right.frontViewScore || 0) - (left.frontViewScore || 0);
      }
      return normalizedCandidates.indexOf(left.url) - normalizedCandidates.indexOf(right.url);
    })
    .map((entry) => entry.url);

  const unresolvedCandidates = normalizedCandidates.filter((url) => !assessedByUrl.has(url));
  const filteredUnresolvedCandidates = hasPersonFreeCandidate
    ? unresolvedCandidates.filter((url) => {
        try {
          const pathname = String(new URL(url).pathname || "").toLowerCase();
          return !PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname);
        } catch {
          return true;
        }
      })
    : unresolvedCandidates;
  const deferredModelCandidates = hasPersonFreeCandidate
    ? unresolvedCandidates.filter((url) => {
        try {
          const pathname = String(new URL(url).pathname || "").toLowerCase();
          return PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname);
        } catch {
          return false;
        }
      })
    : [];

  return uniqValues([
    ...sortedAssessedUrls,
    ...filteredUnresolvedCandidates,
    ...deferredModelCandidates,
  ]);
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

const searchProductPageCandidates = async ({ brand = "", name = "", category = "" }) => {
  const queries = buildProductSearchQueries({ brand, name, category }).slice(0, 3);
  const collected = [];

  for (const query of queries) {
    const searchUrls = [
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    ];
    for (const searchUrl of searchUrls) {
      let html = "";
      try {
        const response = await fetchWithTimeout(
          searchUrl,
          {
            method: "GET",
            redirect: "follow",
            headers: {
              "user-agent": "Mozilla/5.0",
              accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            },
          },
          PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS
        );
        if (!response.ok) continue;
        const contentType = String(response.headers.get("content-type") || "").toLowerCase();
        if (!contentType.includes("text/html")) continue;
        html = await response.text();
      } catch {
        html = "";
      }
      if (!html) continue;

      const resultUrls = extractSearchResultUrls(html, searchUrl)
        .filter((candidate) => scoreProductPageSearchCandidate(candidate, { brand, name }) >= 0)
        .sort(
          (left, right) =>
            scoreProductPageSearchCandidate(right, { brand, name }) -
            scoreProductPageSearchCandidate(left, { brand, name })
        );
      collected.push(...resultUrls);
      if (collected.length >= PRODUCT_METADATA_SEARCH_RESULT_LIMIT) {
        return uniqValues(collected).slice(0, PRODUCT_METADATA_SEARCH_RESULT_LIMIT);
      }
    }
  }

  return uniqValues(collected).slice(0, PRODUCT_METADATA_SEARCH_RESULT_LIMIT);
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
    return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [] };
  }
};

const fetchLinkedSizeMetadataDeep = async (
  initialUrl,
  { maxDepth = 2, maxPages = 4 } = {}
) => {
  const queue = [{ url: initialUrl, depth: 0 }];
  const visited = new Set();
  let bestTable = null;
  const sizeChartImageCandidates = [];
  const visitedPages = [];

  while (queue.length > 0 && visited.size < Math.max(1, Number(maxPages) || 1)) {
    const current = queue.shift();
    const currentUrl = normalizeCellText(current?.url || "");
    const currentDepth = Math.max(0, Number(current?.depth) || 0);
    if (!currentUrl || visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    visitedPages.push(currentUrl);

    const metadata = await fetchSizeMetadataFromLinkedPage(currentUrl);
    if (!bestTable && metadata?.sizeTable) {
      bestTable = alignAndValidateSizeTableByOptionLabels(metadata.sizeTable, []) || metadata.sizeTable;
    }
    sizeChartImageCandidates.push(...(metadata?.sizeChartImageCandidates || []));

    if (currentDepth >= Math.max(0, Number(maxDepth) || 0)) continue;
    for (const nextUrl of uniqValues(metadata?.sizeChartPageCandidates || [])) {
      if (!nextUrl || visited.has(nextUrl)) continue;
      queue.push({ url: nextUrl, depth: currentDepth + 1 });
    }
  }

  return {
    sizeTable: bestTable || null,
    sizeChartImageCandidates: uniqValues(sizeChartImageCandidates),
    visitedPages,
  };
};

const extractSizeTableFromImageCandidates = async (
  imageCandidates,
  { limit = 3 } = {}
) => {
  const normalizedCandidates = uniqValues(imageCandidates).filter(Boolean);
  for (const candidate of normalizedCandidates.slice(0, Math.max(1, Number(limit) || 1))) {
    let payload = null;
    try {
      payload = await downloadImageAsBase64Payload(candidate, {
        minBytes: 1024,
        maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
        minWidth: 160,
        minHeight: 160,
        maxAspectRatio: 6,
        includeBase64: true,
      });
    } catch {
      payload = null;
    }
    if (!payload?.base64) continue;

    const tableResult = await extractSizeTableWithGemini({
      imageBase64: payload.base64,
      mimeType: payload.mimeType || "image/png",
    });
    const validatedTable = alignAndValidateSizeTableByOptionLabels(tableResult.table, []) || null;
    if (validatedTable) {
      return {
        table: validatedTable,
        sourceUrl: payload.sourceUrl || candidate,
      };
    }
  }

  return {
    table: null,
    sourceUrl: "",
  };
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

  const storeBrandFromTitle = normalizeBrandName(String(title || "").split("|").slice(1).join("|"), {
    url: pageUrl,
  });
  const brand = normalizeBrandName(
    pickFirstNonEmpty([
      musinsaData?.brand,
      schemaProduct?.brand,
      extractBrandFromDescription(description),
      storeBrandFromTitle,
    ]),
    { url: pageUrl }
  );

  const schemaName = normalizeCellText(schemaProduct?.name || "");
  const fallbackTitle = pickFirstNonEmpty([ogTitle, title]);
  const name = pickFirstNonEmpty([
    musinsaData?.name,
    schemaName,
    extractProductNameFromTitle(fallbackTitle, brand),
  ]);
  const category = inferProductCategory(
    schemaProduct?.category,
    schemaProduct?.type,
    musinsaData?.category,
    title,
    ogTitle,
    description,
    name
  );

  const candidateGroups = [
    {
      bonus: 15,
      candidates: (musinsaData?.imageCandidates || []).map((candidate) =>
        normalizeUrlCandidate(pageUrl, candidate)
      ),
    },
    {
      bonus: 12,
      candidates: (schemaProduct?.images || []).map((candidate) =>
        normalizeUrlCandidate(pageUrl, candidate)
      ),
    },
    { bonus: 10, candidates: [ogImage, twitterImage] },
    {
      bonus: 8,
      candidates: extractProductImageCandidatesFromHtml({
        html,
        pageUrl,
      }),
    },
    { bonus: 6, candidates: jsonImageData?.productCandidates || [] },
    {
      bonus: 4,
      candidates: extractImageCandidatesFromHtml({
        html,
        pageUrl,
        priorityPattern: /(product|goods|detail|prd|item|big|large)/i,
      }),
    },
  ];

  const sourceBonusByUrl = new Map();
  const rawProductImageCandidates = [];
  for (const group of candidateGroups) {
    for (const candidate of uniqValues(group?.candidates || [])) {
      const normalizedCandidate = normalizeCellText(candidate);
      if (!normalizedCandidate) continue;
      rawProductImageCandidates.push(normalizedCandidate);
      const prevBonus = Number(sourceBonusByUrl.get(normalizedCandidate) || 0);
      if (group.bonus > prevBonus) {
        sourceBonusByUrl.set(normalizedCandidate, Number(group.bonus) || 0);
      }
    }
  }

  const productImageCandidates = sortProductImageCandidates(
    rawProductImageCandidates.filter((candidate) => isLikelyProductImageUrl(candidate)),
    `${brand} ${name}`,
    sourceBonusByUrl
  );

  return {
    brand,
    name,
    category,
    productImageCandidates,
  };
};
const normalizeProductRow = (row) => {
  if (!row || typeof row !== "object") return null;

  const id = String(row.id || "").trim();
  const brand = normalizeBrandName(String(row.brand || "").trim(), {
    url: String(row.url || "").trim(),
  });
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
    slug: String(row.slug || "").trim() || null,
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
  slug,
}) => {
  assertSupabaseConfig();
  const normalizedImagePath = String(imagePath || "").trim();
  const normalizedImage = String(image || "").trim();
  const effectiveImagePath = normalizedImagePath || normalizedImage || null;
  const effectiveImage = normalizedImage || normalizedImagePath || "";
  const normalizedSlug = String(slug || "").trim() || null;

  const canonicalBrand = normalizeBrandName(brand, { url });
  const payloads = [
    {
      brand: canonicalBrand,
      name,
      category,
      url,
      image_path: effectiveImagePath,
      size_table: sizeTable,
      created_at: createdAt,
      slug: normalizedSlug,
    },
    {
      brand: canonicalBrand,
      name,
      category,
      url,
      image_path: effectiveImagePath,
      sizeTable: JSON.stringify(sizeTable),
      createdAt,
      slug: normalizedSlug,
    },
    // Legacy schema fallback (uses `image` column)
    {
      brand: canonicalBrand,
      name,
      category,
      url,
      image: effectiveImage,
      size_table: sizeTable,
      createdAt,
    },
    // Legacy schema fallback (uses `image` column)
    {
      brand: canonicalBrand,
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

  if (lastError) throw lastError;
  throw new Error("failed to insert product");
};

const backfillProductBrands = async () => {
  assertSupabaseConfig();

  const products = await fetchProductsRows();
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const changes = [];

  for (const product of products) {
    const id = String(product?.id || "").trim();
    const currentBrand = String(product?.brand || "").trim();
    const name = String(product?.name || "").trim();
    const url = String(product?.url || "").trim();
    const canonicalBrand = normalizeBrandName(currentBrand, { url });

    if (!id || !currentBrand || !canonicalBrand || canonicalBrand === currentBrand) {
      skippedCount += 1;
      continue;
    }

    const { error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({ brand: canonicalBrand })
      .eq("id", id);

    if (error) {
      failedCount += 1;
      changes.push({
        id,
        name,
        url,
        previousBrand: currentBrand,
        canonicalBrand,
        updated: false,
        error: error.message || "update failed",
      });
      continue;
    }

    updatedCount += 1;
    changes.push({
      id,
      name,
      url,
      previousBrand: currentBrand,
      canonicalBrand,
      updated: true,
      error: "",
    });
  }

  return {
    updatedCount,
    skippedCount,
    failedCount,
    changes,
  };
};

const extractProductMetadataFromUrl = async (rawUrl) => {
  let pageUrl = "";
  try {
    pageUrl = assertPublicHttpUrl(rawUrl);
  } catch (error) {
    const normalizedError = new Error(error?.message || "invalid url");
    normalizedError.statusCode = Number(error?.statusCode) || 400;
    throw normalizedError;
  }

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
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "pragma": "no-cache",
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
    const fetchError = new Error("failed to fetch product page");
    fetchError.statusCode = 502;
    fetchError.detail = lastFetchDetail || "unknown error";
    throw fetchError;
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

  const { imagePath, productImageCandidates } = await prioritizeProductImageCandidates({
    primaryImage: productImage,
    candidates: extracted.productImageCandidates || [],
    brand: extracted.brand || "",
    name: extracted.name || "",
    fastMode: PRODUCT_METADATA_URL_FAST_MODE,
  });

  const hasAnyData = Boolean(
    extracted.brand ||
    extracted.name ||
    extracted.category ||
    productImage ||
    productImageCandidates.length > 0
  );
  if (!hasAnyData) {
    if (isZaraProductUrl(finalPageUrl)) {
      const zaraData = await extractZaraMetadataFromInditexApi(finalPageUrl);
      if (zaraData) return zaraData;
    }
    const emptyError = new Error("could not extract product metadata from url");
    emptyError.statusCode = 502;
    throw emptyError;
  }

  return {
    url: finalPageUrl,
    brand: normalizeBrandName(extracted.brand || "", { url: finalPageUrl }),
    name: extracted.name || "",
    category: normalizeProductCategory(extracted.category || ""),
    image_path: imagePath || "",
    productImage: productImage || null,
    productImageCandidates,
  };
};

const scoreResolvedProductMetadata = (metadata, { brand = "", name = "" } = {}) => {
  if (!metadata) return -1_000;
  const hintTokens = uniqValues(
    `${normalizeCellText(brand)} ${normalizeCellText(name)}`
      .toLowerCase()
      .split(/\s+/)
      .filter((value) => value.length >= 2)
  );
  const metadataText = `${metadata.brand || ""} ${metadata.name || ""} ${metadata.url || ""}`.toLowerCase();
  let score = 0;
  if (metadata.image_path) score += 15;
  if (metadata.productImageCandidates?.length) score += 8;
  if (metadata.brand) score += 4;
  if (metadata.name) score += 8;
  for (const token of hintTokens) {
    if (metadataText.includes(token)) score += 2;
  }
  return score;
};

const resolveProductMetadataFromHints = async ({
  brand = "",
  name = "",
  category = "",
  preferredUrl = "",
}) => {
  const candidateUrls = uniqValues([
    preferredUrl,
    ...(await searchProductPageCandidates({ brand, name, category })),
  ]).filter(Boolean);

  let bestMetadata = null;
  let bestScore = -1_000;
  for (const candidateUrl of candidateUrls) {
    let metadata = null;
    try {
      metadata = await extractProductMetadataFromUrl(candidateUrl);
    } catch {
      metadata = null;
    }
    if (!metadata) continue;
    const score = scoreResolvedProductMetadata(metadata, { brand, name });
    if (score > bestScore) {
      bestScore = score;
      bestMetadata = metadata;
    }
    if (score >= 24) break;
  }

  return {
    metadata: bestMetadata,
    candidateUrls,
  };
};

const assertGeminiKey = () => {
  if (!GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing in server .env");
    error.statusCode = 500;
    throw error;
  }
};

const slugifyText = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const extractEnglishBrand = (brand) => {
  // "쿠어(coor)" → "coor", "MUJI 무인양품" → "MUJI"
  const parenMatch = brand.match(/\(([a-zA-Z0-9][a-zA-Z0-9\s&'./+-]*)\)/);
  if (parenMatch) return parenMatch[1].trim();
  // "L'OFFICIEL JUAN | 로피시엘 주앙" → "L'OFFICIEL JUAN"
  const pipeMatch = brand.match(/^([^|]+)\|/);
  if (pipeMatch) return pipeMatch[1].trim();
  // "MUJI 무인양품" → "MUJI" (English prefix before Korean)
  const prefixMatch = brand.match(/^([A-Za-z0-9][A-Za-z0-9\s&'.+®-]+?)\s+[가-힣]/);
  if (prefixMatch) return prefixMatch[1].trim();
  return brand;
};

const hasKorean = (text) => /[가-힣]/.test(text);

const translateKoreanProductName = async (name) => {
  if (!hasKorean(name)) return name;
  if (!GEMINI_API_KEY) return name;
  try {
    const response = await callGemini("gemini-2.5-flash", {
      contents: [{
        parts: [{
          text: `Translate this Korean fashion product name to English. Return ONLY the English translation, no Korean.\n"배기진" → baggy jeans\n"네오 피쉬테일 코트 카키" → neo fishtail coat khaki\n"울 브이넥 스웨터 멜란지그레이" → wool v-neck sweater melange grey\n"스웨이드 해링턴 자켓 브라운" → suede harrington jacket brown\n"워시드 엔지니어 데님 팬츠 워시드블루그레이" → washed engineer denim pants washed blue grey\n"오버 다이드 커버올 자켓 워시드차콜" → over dyed coverall jacket washed charcoal\n"후드블루종" → hooded blouson\n"해링턴재킷" → harrington jacket\n"에어 포스 1" → air force 1\n"${name}" →`,
        }],
      }],
      generationConfig: { maxOutputTokens: 100, temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
    });
    if (!response.ok) return name;
    const json = await response.json();
    return String(json?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim() || name;
  } catch {
    return name;
  }
};

const generateProductSlug = async (brand, name) => {
  const brandSlug = slugifyText(extractEnglishBrand(brand));
  const translatedName = await translateKoreanProductName(name);
  const nameSlug = slugifyText(translatedName);
  const combined = [brandSlug, nameSlug].filter(Boolean).join("-").replace(/-{2,}/g, "-").slice(0, 80);
  return combined || slugifyText(`${brand} ${name}`);
};

const callGemini = async (model, body) => {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify(body),
    }
  );
  return response;
};

export {
  ADMIN_PASSWORD,
  SUPABASE_PRODUCTS_TABLE,
  SUBMISSIONS_STORAGE_PREFIX,
  assertAdminConfig,
  assertGeminiKey,
  assertSupabaseConfig,
  callGemini,
  clearAdminCookie,
  DUPLICATE_PRODUCT_ERROR_MESSAGE,
  extractProductMetadataFromImageWithGemini,
  extractProductMetadataFromUrl,
  extractSizeTableFromImageCandidates,
  extractSizeTableWithGemini,
  fetchLinkedSizeMetadataDeep,
  fetchProductsRows,
  generateProductSlug,
  getAdminTokenFromCookieHeader,
  getBrandRules,
  backfillProductBrands,
  insertProductRow,
  makeAdminCookie,
  makeAdminSessionToken,
  normalizeBrandName,
  normalizeBrandRule,
  normalizeProductCategory,
  normalizeProductRow,
  parseSizeTable,
  prioritizeProductImageCandidates,
  refreshBrandRulesCache,
  removeOldProductImageIfUnused,
  resolveProductMetadataFromHints,
  safeCompare,
  supabase,
  toProductWriteErrorResponse,
  verifyAdminSessionToken,
  writeBrandRules,
  alignAndValidateSizeTableByOptionLabels,
};
