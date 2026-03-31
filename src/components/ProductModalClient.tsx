"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductsContext } from "../contexts/ProductsContext";
import { ProductDetailRouteModal } from "./ProductDetailRouteModal";
import { parseApiJson, type ApiEnvelope } from "../api/shared";
import type { Product } from "../types";

function parseNumericId(param: string): string {
  return param.match(/^(\d+)/)?.[1] ?? param;
}

export function ProductModalClient({ id }: { id: string }) {
  const { products } = useProductsContext();
  const router = useRouter();
  const numericId = parseNumericId(id);

  const contextProduct = products.find((p) => String(p.id) === numericId) ?? null;

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (contextProduct) return;

    const controller = new AbortController();
    const endpoint = `/api/products/${numericId}`;

    fetch(endpoint, { signal: controller.signal })
      .then((res) => parseApiJson<ApiEnvelope<{ product: Product }>>(res, endpoint))
      .then((payload) => {
        if (payload.ok && payload.data?.product) {
          setFetchedProduct(payload.data.product);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));

    return () => controller.abort();
  }, [numericId, contextProduct]);

  useEffect(() => {
    if (notFound) router.back();
  }, [notFound, router]);

  const product = contextProduct ?? fetchedProduct;

  if (!product) return <div className="fixed inset-0 z-50 bg-black/80" />;

  return <ProductDetailRouteModal product={product} />;
}
