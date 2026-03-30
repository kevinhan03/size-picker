import type { Product } from "../../src/types";
import { refreshBrandRulesCache } from "../utils/brand-rules.js";
import { fetchProductsRows, normalizeProductRow } from "../utils/product.js";

export async function fetchInitialProducts(): Promise<Product[]> {
  await refreshBrandRulesCache();
  const rows = await fetchProductsRows();
  const products: Product[] = [];
  for (const row of rows) {
    const product = normalizeProductRow(row) as Product | null;
    if (product) products.push(product);
  }
  return products;
}
