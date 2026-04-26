import {
  GEMINI_API_BASE,
  GEMINI_API_KEY,
  SUBMISSIONS_STORAGE_PREFIX,
  SUPABASE_PRODUCTS_TABLE,
  SUPABASE_URL,
  SUPABASE_STORAGE_BUCKET,
} from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeBrandName } from "./brand-rules.js";
import { parseSizeTable } from "./size-table.js";

export const DUPLICATE_PRODUCT_ERROR_MESSAGE = "이미 등록된 상품입니다";

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

export const toProductWriteErrorResponse = (error, fallbackMessage) => {
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

const toPublicImageUrl = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (!SUPABASE_URL || !SUPABASE_STORAGE_BUCKET) return normalized;
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${normalized}`;
};

export const normalizeProductRow = (row) => {
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
    image: toPublicImageUrl(image || imagePath),
    thumbnailImage: toPublicImageUrl(imagePath || image),
    imagePath: imagePath || null,
    slug: String(row.slug || "").trim() || null,
    sizeTable: parseSizeTable(row.size_table ?? row.sizeTable),
    createdAt: row.created_at || row.createdAt || null,
    isInstagram: Boolean(row.is_instagram),
    instagramOrder: typeof row.instagram_order === "number" ? row.instagram_order : null,
  };
};

export const fetchProductsRows = async () => {
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

export const removeOldProductImageIfUnused = async ({ oldPath, updatedProductId }) => {
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

  const { error: removeError } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .remove([normalizedOldPath]);

  if (removeError) {
    console.error("[admin] failed to remove old image from storage", {
      path: normalizedOldPath,
      error: removeError.message,
    });
  }
};

export const insertProductRow = async ({
  brand,
  name,
  category,
  url,
  image,
  imagePath,
  sizeTable,
  createdAt,
  slug,
  isInstagram = false,
  instagramOrder = null,
}) => {
  assertSupabaseConfig();
  const normalizedImagePath = String(imagePath || "").trim();
  const normalizedImage = String(image || "").trim();
  const effectiveImagePath = normalizedImagePath || normalizedImage || null;
  const effectiveImage = normalizedImage || normalizedImagePath || "";
  const normalizedSlug = String(slug || "").trim() || null;
  let effectiveInstagramOrder =
    typeof instagramOrder === "number" && Number.isFinite(instagramOrder) ? instagramOrder : null;

  if (isInstagram && effectiveInstagramOrder === null) {
    const { data: lastFeaturedProduct } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .select("instagram_order")
      .eq("is_instagram", true)
      .not("instagram_order", "is", null)
      .order("instagram_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastOrder = Number(lastFeaturedProduct?.instagram_order || 0);
    effectiveInstagramOrder = Number.isFinite(lastOrder) ? lastOrder + 1 : 1;
  }

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
      is_instagram: isInstagram,
      instagram_order: isInstagram ? effectiveInstagramOrder : null,
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
      is_instagram: isInstagram,
      instagram_order: isInstagram ? effectiveInstagramOrder : null,
    },
    {
      brand: canonicalBrand,
      name,
      category,
      url,
      image: effectiveImage,
      size_table: sizeTable,
      createdAt,
      is_instagram: isInstagram,
      instagram_order: isInstagram ? effectiveInstagramOrder : null,
    },
    {
      brand: canonicalBrand,
      name,
      category,
      url,
      image: effectiveImage,
      sizeTable: JSON.stringify(sizeTable),
      created_at: createdAt,
      is_instagram: isInstagram,
      instagram_order: isInstagram ? effectiveInstagramOrder : null,
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

export const backfillProductBrands = async () => {
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

const slugifyText = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const extractEnglishBrand = (brand) => {
  const parenMatch = brand.match(/\(([a-zA-Z0-9][a-zA-Z0-9\s&'./+-]*)\)/);
  if (parenMatch) return parenMatch[1].trim();
  const pipeMatch = brand.match(/^([^|]+)\|/);
  if (pipeMatch) return pipeMatch[1].trim();
  const prefixMatch = brand.match(/^([A-Za-z0-9][A-Za-z0-9\s&'.+-]+?)\s+[가-힣]/);
  if (prefixMatch) return prefixMatch[1].trim();
  return brand;
};

const hasKorean = (text) => /[가-힣]/.test(text);

const translateKoreanProductName = async (name) => {
  if (!hasKorean(name) || !GEMINI_API_KEY) return name;

  try {
    const response = await fetch(`${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Translate this Korean fashion product name to English. Return ONLY the English translation.\n"${name}"` }] }],
        generationConfig: { maxOutputTokens: 100, temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!response.ok) return name;
    const json = await response.json();
    return String(json?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim() || name;
  } catch {
    return name;
  }
};

export const generateProductSlug = async (brand, name) => {
  const brandSlug = slugifyText(extractEnglishBrand(brand));
  const translatedName = await translateKoreanProductName(name);
  const nameSlug = slugifyText(translatedName);
  const combined = [brandSlug, nameSlug].filter(Boolean).join("-").replace(/-{2,}/g, "-").slice(0, 80);
  return combined || slugifyText(`${brand} ${name}`);
};
