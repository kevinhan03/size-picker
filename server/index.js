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

  const headers = Array.isArray(parsed.headers) ? parsed.headers.map((item) => String(item)) : [];
  const rows = Array.isArray(parsed.rows)
    ? parsed.rows.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell)) : []))
    : [];

  if (headers.length === 0 && rows.length === 0) return null;
  return { headers, rows };
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
  const sizeTable = req.body?.sizeTable ?? null;
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
  if ("sizeTable" in (req.body || {})) payload.size_table = req.body?.sizeTable ?? null;

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
      .select("id");

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "product not found",
      });
    }

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
      "Return JSON only. If headers are in English, translate to Korean " +
      "(e.g., Chest -> 가슴둘레, Length -> 총장, Shoulder -> 어깨너비, Sleeve -> 소매길이). " +
      "Keep headers as short labels and rows as plain string values.";

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

    const headers = Array.isArray(parsed?.headers)
      ? parsed.headers.map((header) => String(header))
      : [];
    const rows = Array.isArray(parsed?.rows)
      ? parsed.rows.map((row) =>
          Array.isArray(row) ? row.map((cell) => String(cell)) : []
        )
      : [];

    return res.json({
      ok: true,
      data: { headers, rows },
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
