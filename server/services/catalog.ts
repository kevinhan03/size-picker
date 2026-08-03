import { unstable_cache } from "next/cache";
import type { CatalogPage, Product, ProductCardData, ProductDetailData } from "../../src/types";
import { SUPABASE_PRODUCTS_TABLE } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeProductRow } from "../utils/product.js";

export const PRODUCT_CARD_COLUMNS = [
  "id", "brand", "name", "category", "url", "image_path", "slug", "created_at",
  "is_instagram", "instagram_order", "target_gender",
].join(",");

export const PRODUCT_DETAIL_COLUMNS = [
  PRODUCT_CARD_COLUMNS,
  "size_table", "normalized_size_table", "registered_by",
  "style_tags", "style_attributes", "human_style_tags", "human_style_attributes", "tag_review_status",
].join(",");

export const RECOMMENDATION_COLUMNS = [
  PRODUCT_CARD_COLUMNS, "style_tags", "style_attributes", "human_style_tags", "human_style_attributes",
  "tag_review_status", "human_target_gender",
].join(",");

// Backward-compatible aliases for server-only callers while their response contracts
// are progressively narrowed.
export const CATALOG_COLUMNS = PRODUCT_CARD_COLUMNS;
export const ANALYSIS_COLUMNS = `${RECOMMENDATION_COLUMNS},image_embedding`;

const toCard = (product: Product): ProductCardData => ({
  id: product.id,
  brand: product.brand,
  name: product.name,
  category: product.category,
  url: product.url,
  image: product.image,
  thumbnailImage: product.thumbnailImage,
  slug: product.slug,
  createdAt: product.createdAt,
  isInstagram: product.isInstagram,
  instagramOrder: product.instagramOrder,
  targetGender: product.targetGender,
});

export const normalizeProductCard = (row: unknown): ProductCardData | null => {
  const product = normalizeProductRow(row) as Product | null;
  return product ? toCard(product) : null;
};

export const normalizeProductDetail = (row: unknown): ProductDetailData | null => {
  const product = normalizeProductRow(row) as Product | null;
  if (!product) return null;
  return {
    ...toCard(product),
    imagePath: product.imagePath,
    sizeTable: product.sizeTable,
    normalizedSizeTable: product.normalizedSizeTable,
    registeredBy: product.registeredBy,
    styleTags: product.styleTags,
    styleAttributes: product.styleAttributes,
    humanStyleTags: product.humanStyleTags,
    humanStyleAttributes: product.humanStyleAttributes,
    tagReviewStatus: product.tagReviewStatus,
  };
};

export const normalizeClientProduct = (row: unknown): Product | null => {
  const product = normalizeProductRow(row) as Product | null;
  if (!product) return null;
  const clientProduct = { ...product };
  delete clientProduct.imageEmbedding;
  return clientProduct;
};

export const normalizeAnalysisProduct = (row: unknown): Product | null =>
  normalizeProductRow(row) as Product | null;

const queryCatalogPage = async (offset: number, limit: number): Promise<CatalogPage> => {
  assertSupabaseConfig();
  const { data, error } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .select(PRODUCT_CARD_COLUMNS)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  const products = rows.slice(0, limit).map(normalizeProductCard).filter((product): product is ProductCardData => Boolean(product));
  return { products, nextOffset: rows.length > limit ? offset + limit : null };
};

const getCachedCatalogPage = unstable_cache(queryCatalogPage, ["catalog-page-v2"], {
  revalidate: 60,
  tags: ["catalog"],
});

export const getCatalogPage = (offset = 0, limit = 24) => getCachedCatalogPage(offset, limit);

const queryCatalogSearch = async (query: string, limit: number): Promise<ProductCardData[]> => {
  assertSupabaseConfig();
  const { data, error } = await supabase!.rpc("search_catalog", {
    search_query: query,
    result_limit: limit,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map(normalizeProductCard)
    .filter((product): product is ProductCardData => Boolean(product));
};

const getCachedCatalogSearch = unstable_cache(queryCatalogSearch, ["catalog-search-v2"], {
  revalidate: 300,
  tags: ["search"],
});

export const searchCatalog = (query: string, limit = 8) => getCachedCatalogSearch(query, limit);

const queryProductDetail = async (id: string): Promise<ProductDetailData | null> => {
  assertSupabaseConfig();
  const { data, error } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .select(PRODUCT_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return normalizeProductDetail(data);
};

export const getProductDetail = (id: string) => unstable_cache(
  () => queryProductDetail(id),
  ["product-detail-v2", id],
  { revalidate: 300, tags: [`product:${id}`] },
)();

export const requestLog = (route: string, request: Request, startedAt: number, status: number, cache?: string) => {
  const payload = {
    route,
    requestId: request.headers.get("x-vercel-id"),
    ms: Date.now() - startedAt,
    status,
    ...(cache ? { cache } : {}),
  };
  const message = JSON.stringify(payload);
  if (status >= 400) console.error(message);
  else console.log(message);
};
