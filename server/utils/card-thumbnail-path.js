import { createHash } from "node:crypto";
import { SUPABASE_URL, SUPABASE_STORAGE_BUCKET } from "../config/env.js";

export const CARD_THUMBNAIL_VERSION = "v1";
export function cardThumbnailLocation(id, imagePath) {
  let source = String(imagePath || "").trim();
  if (!source || !/^[a-z0-9-]+$/i.test(String(id))) return null;
  if (/^https?:/i.test(source)) {
    const prefix = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
    if (!source.startsWith(prefix)) return null;
    try { source = decodeURIComponent(source.slice(prefix.length)); } catch { return null; }
  }
  if (source.includes("..") || source.startsWith("/")) return null;
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 24);
  const path = `card-thumbnails/${CARD_THUMBNAIL_VERSION}/${id}/${hash}.webp`;
  return { source, path, url: `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${path}` };
}
