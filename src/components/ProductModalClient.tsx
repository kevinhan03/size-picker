"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductDetailRouteModal } from "./ProductDetailRouteModal";
import { parseApiJson, type ApiEnvelope } from "../api/shared";
import type { Product } from "../types";

function parseNumericId(param: string): string {
  return param.match(/^(\d+)/)?.[1] ?? param;
}

export function ProductModalClient({
  id,
  initialProduct,
  closeHref,
}: {
  id: string;
  initialProduct?: Product;
  closeHref?: string;
}) {
  const router = useRouter();
  const numericId = parseNumericId(id);

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialProduct) return;

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
  }, [initialProduct, numericId]);

  useEffect(() => {
    if (!notFound) return;
    if (closeHref) router.replace(closeHref);
    else router.back();
  }, [closeHref, notFound, router]);

  const product = initialProduct ?? fetchedProduct;

  if (!product) return <div className="fixed inset-0 z-[65] bg-black/80" />;

  return <ProductDetailRouteModal product={product} onClose={closeHref ? () => router.replace(closeHref) : undefined} />;
}
