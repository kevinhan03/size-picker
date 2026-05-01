import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClosetItems, addToCloset as apiAdd, removeFromCloset as apiRemove } from "../api";
import type { ClosetSizeSelection, Product } from "../types";

export type ClosetToast = { message: string; type: "success" | "info" | "error" } | null;

export function useCloset(isLoggedIn: boolean) {
  const [closetProducts, setClosetProducts] = useState<Product[]>([]);
  const [closetIds, setClosetIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ClosetToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const showToast = useCallback((t: ClosetToast) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(t);
    if (t) {
      toastTimerRef.current = setTimeout(() => setToast(null), 2300);
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
      hasLoadedRef.current = false;
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const products = await fetchClosetItems();
      setClosetProducts(products);
      setClosetIds(new Set(products.map((p) => p.id)));
      hasLoadedRef.current = true;
    } catch {
      // silent
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) void load();
  }, [isLoggedIn, load]);

  const ensureLoaded = useCallback(() => {
    if (!isLoggedIn || hasLoadedRef.current) return;
    void load();
  }, [isLoggedIn, load]);

  const addToCloset = useCallback(async (productId: string, sizeSelection?: ClosetSizeSelection | null) => {
    if (closetIds.has(productId)) return;
    await apiAdd(productId, sizeSelection);
    setClosetIds((prev) => new Set([...prev, productId]));
    void load();
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

  const toggleCloset = useCallback(async (productId: string, sizeSelection?: ClosetSizeSelection | null) => {
    if (!isLoggedIn) {
      showToast({ message: "login_required", type: "info" });
      return;
    }
    if (closetIds.has(productId)) {
      showToast({ message: "already_added", type: "info" });
      return;
    }
    try {
      await addToCloset(productId, sizeSelection);
      showToast({ message: "added", type: "success" });
    } catch (error) {
      console.error("[closet] add failed", error);
      showToast({ message: "add_failed", type: "error" });
    }
  }, [isLoggedIn, closetIds, addToCloset, showToast]);

  return { closetProducts, closetIds, isLoading, toast, clearToast, addToCloset, removeFromCloset, isInCloset, toggleCloset, reload: load, ensureLoaded };
}
