import { unstable_cache } from "next/cache";
import { SUPABASE_PRODUCTS_TABLE, SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";

export const DIG_MATCH_PRODUCTS_CACHE_TAG = "dig-match-products";
export const DIG_MATCH_CANDIDATE_BATCH_SIZE = 72;
const DIG_MATCH_CANDIDATE_CATEGORIES = ["Top", "Bottom", "Outer"];

const DIG_MATCH_PRODUCT_COLUMNS = [
  "id",
  "brand",
  "name",
  "category",
  "url",
  "image_path",
  "slug",
  "style_tags",
  "style_attributes",
  "human_style_tags",
  "human_style_attributes",
  "tag_review_status",
].join(",");

function toProductImageUrls(imagePath) {
  const path = String(imagePath || "").trim();
  if (!path) return { image: "", thumbnailImage: "" };
  if (/^https?:\/\//i.test(path)) return { image: path, thumbnailImage: path };

  const storage = supabase.storage.from(SUPABASE_STORAGE_BUCKET);
  return {
    image: storage.getPublicUrl(path).data.publicUrl,
    thumbnailImage: storage.getPublicUrl(path, {
      transform: { width: 480, height: 640, quality: 70 },
    }).data.publicUrl,
  };
}

function normalizeDigMatchProduct(row) {
  const id = String(row?.id || "").trim();
  const brand = String(row?.brand || "").trim();
  const name = String(row?.name || "").trim();
  if (!id || !brand || !name) return null;

  const imagePath = String(row.image_path || "").trim() || null;
  const { image, thumbnailImage } = toProductImageUrls(imagePath);
  return {
    id,
    brand,
    name,
    category: String(row.category || "Uncategorized"),
    url: String(row.url || ""),
    image,
    thumbnailImage,
    imagePath,
    slug: String(row.slug || "").trim() || null,
    sizeTable: null,
    styleTags: row.style_tags ?? null,
    styleAttributes: row.style_attributes ?? null,
    humanStyleTags: row.human_style_tags ?? null,
    humanStyleAttributes: row.human_style_attributes ?? null,
    tagReviewStatus: row.tag_review_status ? String(row.tag_review_status) : null,
  };
}

const getCachedDigMatchProducts = unstable_cache(
  async () => {
    assertSupabaseConfig();
    // Keep cold-cache work bounded. Dig Match does not use inferred gender as
    // a product filter because the catalogue has no user-maintained split.
    const results = await Promise.all(
      [
        ...DIG_MATCH_CANDIDATE_CATEGORIES.map((category) => ({ category, count: DIG_MATCH_CANDIDATE_BATCH_SIZE })),
        { category: null, count: DIG_MATCH_CANDIDATE_BATCH_SIZE },
      ].map(({ category, count }) => {
        let query = supabase
          .from(SUPABASE_PRODUCTS_TABLE)
          .select(DIG_MATCH_PRODUCT_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(count);
        query = category
          ? query.eq("category", category)
          : query.not("category", "in", `(${DIG_MATCH_CANDIDATE_CATEGORIES.join(",")})`);
        return query;
      })
    );
    for (const { error } of results) {
      if (error) throw error;
    }
    return results
      .flatMap(({ data }) => (Array.isArray(data) ? data : []))
      .map(normalizeDigMatchProduct)
      .filter(Boolean);
  },
  [DIG_MATCH_PRODUCTS_CACHE_TAG],
  { tags: [DIG_MATCH_PRODUCTS_CACHE_TAG] }
);

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function selectCandidateBatch(products, limit) {
  const selected = [];
  const selectedIds = new Set();
  const take = (items, count) => {
    let taken = 0;
    for (const product of shuffle(items)) {
      if (selected.length >= limit || taken >= count) break;
      if (selectedIds.has(product.id)) continue;
      selected.push(product);
      selectedIds.add(product.id);
      taken += 1;
    }
  };

  // The comparison generator needs a healthy mix of these three categories;
  // reserve room for other categories so they can still appear in results.
  take(products.filter((product) => product.category === "Top"), 22);
  take(products.filter((product) => product.category === "Bottom"), 20);
  take(products.filter((product) => product.category === "Outer"), 18);
  take(products.filter((product) => !DIG_MATCH_CANDIDATE_CATEGORIES.includes(product.category)), 12);
  take(products, limit);
  return selected;
}

export async function getDigMatchProducts({ limit = DIG_MATCH_CANDIDATE_BATCH_SIZE } = {}) {
  const normalizedLimit = Math.max(24, Math.min(Number(limit) || DIG_MATCH_CANDIDATE_BATCH_SIZE, DIG_MATCH_CANDIDATE_BATCH_SIZE));
  const products = await getCachedDigMatchProducts();
  return selectCandidateBatch(products, normalizedLimit);
}
