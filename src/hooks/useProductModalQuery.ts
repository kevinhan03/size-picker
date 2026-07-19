"use client";

import { useCallback, useEffect, useState } from "react";

const PRODUCT_MODAL_HISTORY_KEY = "sizepickerProductModal";

function readProductId() {
  return new URLSearchParams(window.location.search).get("product");
}

function updateProductId(productId: string | null, replace: boolean, state = window.history.state) {
  const url = new URL(window.location.href);
  if (productId) url.searchParams.set("product", productId);
  else url.searchParams.delete("product");

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history[replace ? "replaceState" : "pushState"](state, "", nextUrl);
}

/** Keeps a product-detail modal addressable without leaving its source page. */
export function useProductModalQuery() {
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    const syncProductId = () => setProductId(readProductId());
    syncProductId();
    window.addEventListener("popstate", syncProductId);
    return () => window.removeEventListener("popstate", syncProductId);
  }, []);

  const openProduct = useCallback((id: string, replace = false) => {
    const state = replace
      ? window.history.state
      : { ...(window.history.state || {}), [PRODUCT_MODAL_HISTORY_KEY]: true };
    updateProductId(id, replace, state);
    setProductId(id);
  }, []);

  const closeProduct = useCallback(() => {
    if (window.history.state?.[PRODUCT_MODAL_HISTORY_KEY]) {
      window.history.back();
    } else {
      updateProductId(null, true);
    }
    setProductId(null);
  }, []);

  return { productId, openProduct, closeProduct };
}
