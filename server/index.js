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

const normalizeCellText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizeAliasKey = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z\u3131-\uD79D]/g, "");

const normalizeMeasurementLabel = (value) => {
  const raw = normalizeCellText(value);
  if (!raw) return "";
  return MEASUREMENT_ALIAS_MAP[normalizeAliasKey(raw)] || raw;
};

const normalizeSizeLabel = (value) => normalizeCellText(value).toUpperCase();

const isLikelySizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return false;
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
  if (/^(0|1|2|3|4|5|6|7|8|9|10|11|12)$/.test(text)) return true;
  if (/^\d{2,4}$/.test(text)) return true;
  if (/^(EU|US|UK|JP|KR)\s*\d{1,3}$/.test(text)) return true;
  return false;
};

const isLikelyMeasurementLabel = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  return Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized);
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
  const measurementInRows = rowHeaders.filter((v) => isLikelyMeasurementLabel(v)).length;
  const sizeInRows = rowHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const measurementInColumns = columnHeaders.filter((v) => isLikelyMeasurementLabel(v)).length;
  return sizeInColumns * 3 + measurementInRows * 3 - sizeInRows - measurementInColumns;
};

const sortMeasurementRows = (rows) =>
  [...rows].sort((left, right) => {
    const leftLabel = normalizeMeasurementLabel(left?.[0] || "");
    const rightLabel = normalizeMeasurementLabel(right?.[0] || "");
    if (leftLabel === TOTAL_LENGTH_LABEL && rightLabel !== TOTAL_LENGTH_LABEL) return -1;
    if (rightLabel === TOTAL_LENGTH_LABEL && leftLabel !== TOTAL_LENGTH_LABEL) return 1;
    return 0;
  });

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
    tableOrientationScore(transposed) < tableOrientationScore(asIs) ? transposed : asIs;

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
    assertGeminiKey();

    const prompt =
      "Analyze this clothing size chart image and extract table data. " +
      "Return JSON only with `headers` and `rows`. " +
      "Use Korean labels for measurements when possible (총장, 어깨, 가슴, 소매, 허리, 엉덩이, 허벅지, 밑위, 밑단). " +
      "Keep every cell as a plain string.";

    const responseSchema = {
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

    const modelCandidates = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
    let response = null;
    let lastErrorText = "";

    for (const model of modelCandidates) {
      const candidateResponse = await callGemini(model, {
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      if (candidateResponse.ok) {
        response = candidateResponse;
        break;
      }

      lastErrorText = await candidateResponse.text();
    }

    if (!response) {
      return res.status(502).json({
        ok: false,
        error: "Gemini size-table request failed",
        detail: lastErrorText || "unknown error",
      });
    }

    const payload = await response.json();
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    if (candidates.length === 0) {
      return res.status(502).json({
        ok: false,
        error: "Gemini returned no candidates",
        detail: payload?.promptFeedback || payload,
      });
    }
    const rawText =
      candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        ok: false,
        error: "Gemini did not return valid JSON",
        detail: rawText,
      });
    }

    const normalizedTable = standardizeSizeTable(parsed);
    if (!normalizedTable) {
      return res.status(502).json({
        ok: false,
        error: "Gemini returned empty size-table data",
      });
    }

    return res.json({
      ok: true,
      data: normalizedTable,
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
