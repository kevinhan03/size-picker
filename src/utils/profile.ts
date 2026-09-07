import type { Product } from "../types";

export interface PublicProfile {
  username: string;
  bio: string;
  avatarUrl: string | null;
  products: Product[];
}

export function savedAt(product: Product): number {
  const value = Date.parse(product.collectionAddedAt || "");
  return Number.isFinite(value) ? value : 0;
}

export function profileActivity(products: Product[], now: number) {
  const sorted = [...products].sort((a, b) => savedAt(b) - savedAt(a));
  const brands = new Map<
    string,
    { name: string; count: number; latest: number }
  >();
  for (const product of sorted) {
    const date = savedAt(product);
    const name = product.brand.trim();
    if (!name || !date || date > now || date < now - 30 * 86400000) continue;
    const key = name.toLowerCase();
    const previous = brands.get(key);
    brands.set(key, {
      name: previous?.name || name,
      count: (previous?.count || 0) + 1,
      latest: Math.max(date, previous?.latest || 0),
    });
  }
  return {
    recent: sorted.slice(0, 4),
    brands: [...brands.values()]
      .sort(
        (a, b) =>
          b.count - a.count ||
          b.latest - a.latest ||
          a.name.localeCompare(b.name)
      )
      .slice(0, 3),
  };
}

/** Never serialize a collection owner's private fit decisions into a public profile. */
export function publicProfileProduct(product: Product): Product {
  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    category: product.category,
    subCategory: product.subCategory,
    url: product.url,
    image: product.image,
    thumbnailImage: product.thumbnailImage,
    imagePath: product.imagePath,
    slug: product.slug,
    collectionAddedAt: product.collectionAddedAt,
    styleAxes: product.styleAxes,
    humanStyleAxes: product.humanStyleAxes,
    styleAxesReviewedAt: product.styleAxesReviewedAt,
    styleAttributes: product.styleAttributes,
    humanStyleAttributes: product.humanStyleAttributes,
    factsReviewedAt: product.factsReviewedAt,
    targetGender: product.targetGender,
    humanTargetGender: product.humanTargetGender,
  };
}

export function profileTab(
  value: string | null | undefined
): "saved" | "closet" {
  return value === "closet" ? "closet" : "saved";
}
