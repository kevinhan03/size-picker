import type { Product } from "../../src/types";
import { normalizeProductRow } from "../utils/product.js";

export const CATALOG_COLUMNS = [
  "id", "brand", "name", "category", "url", "image_path", "slug", "size_table", "normalized_size_table",
  "created_at", "is_instagram", "instagram_order", "registered_by", "style_tags", "style_attributes",
  "human_style_tags", "human_style_attributes", "tag_review_status", "tag_review_note", "target_gender",
  "human_target_gender",
].join(",");

export const ANALYSIS_COLUMNS = `${CATALOG_COLUMNS},image_embedding`;

export const normalizeClientProduct = (row: unknown): Product | null => {
  const product = normalizeProductRow(row) as Product | null;
  if (!product) return null;
  const clientProduct = { ...product };
  delete clientProduct.imageEmbedding;
  return clientProduct;
};

export const normalizeAnalysisProduct = (row: unknown): Product | null =>
  normalizeProductRow(row) as Product | null;

export const requestLog = (route: string, request: Request, startedAt: number, status: number) => {
  const payload = {
    route,
    requestId: request.headers.get("x-vercel-id"),
    ms: Date.now() - startedAt,
    status,
  };
  const message = JSON.stringify(payload);
  if (status >= 400) console.error(message);
  else console.log(message);
};
