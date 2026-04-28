import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDigboxItems, addToDigbox as apiAdd, removeFromDigbox as apiRemove } from "../api";
import type { Product } from "../types";

export type DigboxToast = { message: string; type: "success" | "info" | "error" } | null;

export function useDigbox(isLoggedIn: boolean) {
  const [digboxProducts, setDigboxProducts] = useState<Product[]>([]);
  const [digboxIds, setDigboxIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<DigboxToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((t: DigboxToast) => {
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
      setDigboxProducts([]);
      setDigboxIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const products = await fetchDigboxItems();
      setDigboxProducts(products);
      setDigboxIds(new Set(products.map((p) => p.id)));
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setTimeout(() => void load(), 0);
  }, [load]);

  const addToDigbox = useCallback(async (productId: string) => {
    if (digboxIds.has(productId)) return;
    await apiAdd(productId);
    setDigboxIds((prev) => new Set([...prev, productId]));
    void load();
  }, [digboxIds, load]);

  const removeFromDigbox = useCallback(async (productId: string) => {
    await apiRemove(productId);
    setDigboxIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setDigboxProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const isInDigbox = useCallback((productId: string) => digboxIds.has(productId), [digboxIds]);

  const toggleDigbox = useCallback(async (productId: string) => {
    if (!isLoggedIn) {
      showToast({ message: "login_required", type: "info" });
      return;
    }
    if (digboxIds.has(productId)) {
      showToast({ message: "already_added", type: "info" });
      return;
    }
    try {
      await addToDigbox(productId);
      showToast({ message: "added", type: "success" });
    } catch (error) {
      console.error("[digbox] add failed", error);
      showToast({ message: "add_failed", type: "error" });
    }
  }, [isLoggedIn, digboxIds, addToDigbox, showToast]);

  return { digboxProducts, digboxIds, isLoading, toast, clearToast, addToDigbox, removeFromDigbox, isInDigbox, toggleDigbox, reload: load };
}
