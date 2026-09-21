import type {
  Product,
  ProductCardData,
  StyleProfileKey,
} from "../../../src/types";
import {
  getProductStyleProfile,
  styleProfileLabels,
} from "../../../src/utils/styleProfile";
import { supabase } from "../../lib/supabase.js";

export function compactCard(product: Product): ProductCardData {
  const {
    id,
    name,
    brand,
    category,
    subCategory,
    url,
    image,
    slug,
    thumbnailImage,
    cardThumbnailImage,
    targetGender,
  } = product;
  return {
    id,
    name,
    brand,
    category,
    subCategory,
    url,
    image,
    slug,
    thumbnailImage,
    cardThumbnailImage,
    targetGender,
  };
}

export function tasteRepresentatives(
  products: Product[],
  tags: StyleProfileKey[],
  locale: string
) {
  const used = new Set<string>();
  const profiles = products.map((product) => ({
    product,
    profile: getProductStyleProfile(product),
  }));
  return tags.map((tag) => {
    const ranked = profiles
      .flatMap(({ product, profile }) => {
        const entry = profile?.displayEntries.find(
          (entry) => entry.key === tag
        );
        const total =
          profile?.entries.reduce((sum, entry) => sum + entry.score, 0) || 1;
        const score =
          profile?.entries.find((entry) => entry.key === tag)?.score || 0;
        return entry ? [{ product, score: score / total }] : [];
      })
      .sort(
        (a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id)
      );
    const selected = ranked
      .filter(({ product }) => !used.has(product.id))
      .slice(0, 3);
    selected.forEach(({ product }) => used.add(product.id));
    return {
      label: styleProfileLabels(tag, locale),
      products: selected.map(({ product }) => compactCard(product)),
    };
  });
}

/** Check both collections for the bounded candidate pool, independent of taste source. */
export async function candidateRelationships(userId: string, ids: string[]) {
  const result = new Map<string, "new" | "saved" | "owned">();
  for (let start = 0; start < ids.length; start += 200) {
    const chunk = ids.slice(start, start + 200);
    const responses = await Promise.all(
      ["user_digbox_items", "user_closet_items"].map((table) =>
        supabase!
          .from(table)
          .select("product_id")
          .eq("user_id", userId)
          .in("product_id", chunk)
      )
    );
    for (const response of responses) if (response.error) throw response.error;
    chunk.forEach((id) => result.set(id, "new"));
    responses[0].data?.forEach((row) =>
      result.set(String(row.product_id), "saved")
    );
    responses[1].data?.forEach((row) =>
      result.set(String(row.product_id), "owned")
    );
  }
  return result;
}

/** Preserve relevance order; allow at most two familiar items in an eight-card discovery. */
export function discoveryMix<T>(
  items: T[],
  relationship: (item: T) => string | undefined
): T[] {
  let familiar = 0;
  return items
    .filter((item) => relationship(item) === "new" || ++familiar <= 2)
    .slice(0, 8);
}
