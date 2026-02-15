import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const SUPABASE_PRODUCTS_TABLE = (process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

app.use(cors());
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
  if (!id || !brand || !name) return null;

  return {
    id,
    brand,
    name,
    category: String(row.category || "User Uploaded"),
    url: String(row.url || "#"),
    image: String(row.image || ""),
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

const insertProductRow = async ({ brand, name, category, url, image, sizeTable, createdAt }) => {
  assertSupabaseConfig();

  const payloads = [
    {
      brand,
      name,
      category,
      url,
      image,
      size_table: sizeTable,
      created_at: createdAt,
    },
    {
      brand,
      name,
      category,
      url,
      image,
      sizeTable: JSON.stringify(sizeTable),
      createdAt,
    },
    {
      brand,
      name,
      category,
      url,
      image,
      size_table: sizeTable,
      createdAt,
    },
    {
      brand,
      name,
      category,
      url,
      image,
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
