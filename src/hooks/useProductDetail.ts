"use client";

import { useEffect, useState } from "react";
import { parseApiJson, type ApiEnvelope } from "../api/shared";
import type { Product } from "../types";

const detailCache = new Map<string, Product>();
const detailRequests = new Map<string, Promise<Product | null>>();

const fetchProductDetail = (productId: string): Promise<Product | null> => {
  const cached = detailCache.get(productId);
  if (cached) return Promise.resolve(cached);

  const pending = detailRequests.get(productId);
  if (pending) return pending;

  const endpoint = `/api/products/${productId}`;
  const request = fetch(endpoint)
    .then((response) =>
      parseApiJson<ApiEnvelope<{ product: Product }>>(response, endpoint)
    )
    .then((payload) => {
      const product = payload.ok ? payload.data?.product ?? null : null;
      if (product) detailCache.set(productId, product);
      return product;
    })
    .catch(() => null)
    .finally(() => detailRequests.delete(productId));

  detailRequests.set(productId, request);
  return request;
};

/** Starts the lazy detail request before a product card is opened. */
export const prefetchProductDetail = (productId: string) => {
  void fetchProductDetail(productId);
};

export function useProductDetail(productId: string | null, fallback: Product | null) {
  const [detail, setDetail] = useState<Product | null>(null);

  useEffect(() => {
    setDetail(null);
    if (!productId) return;

    let active = true;
    const cached = detailCache.get(productId);
    if (cached) setDetail(cached);

    void fetchProductDetail(productId).then((product) => {
      if (active && product) setDetail(product);
    });

    return () => {
      active = false;
    };
  }, [productId]);

  if (detail?.id === productId) return detail;
  return fallback?.id === productId ? fallback : null;
}
