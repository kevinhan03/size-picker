"use client";

import { useEffect, useState } from "react";
import { parseApiJson, type ApiEnvelope } from "../api/shared";
import type { Product } from "../types";

export function useProductDetail(productId: string | null, fallback: Product | null) {
  const [detail, setDetail] = useState<Product | null>(null);

  useEffect(() => {
    setDetail(null);
    if (!productId) return;

    const controller = new AbortController();
    const endpoint = `/api/products/${productId}`;

    void fetch(endpoint, { signal: controller.signal })
      .then((response) => parseApiJson<ApiEnvelope<{ product: Product }>>(response, endpoint))
      .then((payload) => {
        if (payload.ok && payload.data?.product) setDetail(payload.data.product);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [productId]);

  if (detail?.id === productId) return detail;
  return fallback?.id === productId ? fallback : null;
}
