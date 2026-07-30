import { randomUUID } from "node:crypto";
import {
  PRODUCT_METADATA_MAX_IMAGE_BYTES,
  SUBMISSIONS_STORAGE_PREFIX,
  SUPABASE_STORAGE_BUCKET,
} from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { fetchWithTimeout } from "./product-metadata/url.js";

const IMAGE_EXTENSION_BY_MIME_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const isExternalImageUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

export const isStoredProductImagePath = (value) =>
  String(value || "").trim().startsWith(SUBMISSIONS_STORAGE_PREFIX);

const detectSupportedImageMimeType = (imageData) => {
  if (imageData.length >= 3 && imageData[0] === 0xff && imageData[1] === 0xd8 && imageData[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    imageData.length >= 8 &&
    imageData.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (imageData.length >= 12 && imageData.toString("ascii", 0, 4) === "RIFF" && imageData.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return "";
};

/**
 * Persists externally hosted catalog images in our Storage bucket so product
 * records never depend on a retailer's image host after registration.
 */
export async function persistExternalProductImage(imagePath) {
  const sourceUrl = String(imagePath || "").trim();
  if (!sourceUrl || !isExternalImageUrl(sourceUrl)) return sourceUrl;

  assertSupabaseConfig();
  const response = await fetchWithTimeout(sourceUrl, {
    method: "GET",
    headers: {
      // Avoid negotiating AVIF: the catalog currently standardizes persisted
      // assets on formats supported by its thumbnail pipeline.
      accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    const error = new Error("product image could not be downloaded");
    error.statusCode = 422;
    throw error;
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > PRODUCT_METADATA_MAX_IMAGE_BYTES) {
    const error = new Error("product image is too large");
    error.statusCode = 413;
    throw error;
  }

  const imageData = Buffer.from(await response.arrayBuffer());
  if (!imageData.length) {
    const error = new Error("product image is empty");
    error.statusCode = 422;
    throw error;
  }
  if (imageData.length > PRODUCT_METADATA_MAX_IMAGE_BYTES) {
    const error = new Error("product image is too large");
    error.statusCode = 413;
    throw error;
  }

  const mimeType = detectSupportedImageMimeType(imageData);
  const extension = IMAGE_EXTENSION_BY_MIME_TYPE[mimeType];
  if (!extension) {
    const error = new Error("product image must be a JPEG, PNG, or WebP file");
    error.statusCode = 422;
    throw error;
  }

  const storagePath = `${SUBMISSIONS_STORAGE_PREFIX}imported/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, imageData, { contentType: mimeType, upsert: false });
  if (uploadError) throw uploadError;

  return storagePath;
}

export async function removeStoredProductImage(path) {
  const storagePath = String(path || "").trim();
  if (!isStoredProductImagePath(storagePath)) return;
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([storagePath]);
  if (error) throw error;
}
