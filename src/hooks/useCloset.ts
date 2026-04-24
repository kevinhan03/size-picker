import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClosetItems, addToCloset as apiAdd, removeFromCloset as apiRemove } from "../api";
import type { Product } from "../types";

export type ClosetToast = { message: string; type: "success" | "info" } | null;

export function useCloset(isLoggedIn: boolean) {
  const [closetProducts, setClosetProducts] = useState<Product[]>([]);
  const [closetIds, setClosetIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ClosetToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((t: ClosetToast) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(t);
    if (t) {
      toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    }
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setClosetProducts([]);
      setClosetIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const products = await fetchClosetItems();
      setClosetProducts(products);
      setClosetIds(new Set(products.map((p) => p.id)));
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const addToCloset = useCallback(async (productId: string) => {
    if (closetIds.has(productId)) return;
    await apiAdd(productId);
    setClosetIds((prev) => new Set([...prev, productId]));
    await load();
  }, [closetIds, load]);

  const removeFromCloset = useCallback(async (productId: string) => {
    await apiRemove(productId);
    setClosetIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setClosetProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const isInCloset = useCallback((productId: string) => closetIds.has(productId), [closetIds]);

  const toggleCloset = useCallback(async (productId: string) => {
    if (!isLoggedIn) {
      showToast({ message: "login_required", type: "info" });
      return;
    }
    if (closetIds.has(productId)) {
      showToast({ message: "already_added", type: "info" });
      return;
    }
    try {
      await addToCloset(productId);
      showToast({ message: "added", type: "success" });
    } catch {
      // silent
    }
  }, [isLoggedIn, closetIds, addToCloset, showToast]);

  return { closetProducts, closetIds, isLoading, toast, clearToast, addToCloset, removeFromCloset, isInCloset, toggleCloset, reload: load };
}
