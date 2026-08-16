import type { ComponentType } from "react";

export const loadProductDetailModal = (): Promise<ComponentType<import("./ProductDetailModal").ProductDetailModalProps>> =>
  import("./ProductDetailModal").then((module) => module.ProductDetailModal);
