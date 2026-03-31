import { unstable_cache } from "next/cache";
import type { Product } from "../../src/types";
import { refreshBrandRulesCache } from "../utils/brand-rules.js";
import { fetchProductsRows, normalizeProductRow } from "../utils/product.js";

async function _fetchInitialProducts(): Promise<Product[]> {
  const [, rows] = await Promise.all([refreshBrandRulesCache(), fetchProductsRows()]);
  const products: Product[] = [];
  for (const row of rows) {
    const product = normalizeProductRow(row) as Product | null;
    if (product) products.push(product);
  }
  return products;
}

export const fetchInitialProducts = unstable_cache(
  _fetchInitialProducts,
  ["initial-products"],
  { revalidate: 300 }
);
