import type { Product } from "../types";

export const PRODUCT_CREATED_EVENT = "digbox:product-created";

export function announceProductCreated(product: Product) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Product>(PRODUCT_CREATED_EVENT, { detail: product }));
}
