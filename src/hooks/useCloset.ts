import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchClosetItems, addToCloset as apiAdd, removeFromCloset as apiRemove } from "../api";
import { useCollectionBootstrap } from "../contexts/CollectionBootstrapContext";
import type { ClosetSizeSelection, Product } from "../types";
import { useLocaleContext } from "../contexts/LocaleContext";

export type ClosetToast = { message: string; type: "success" | "info" | "error" } | null;

export function useCloset(
  isLoggedIn: boolean,
  initialProducts?: Product[],
  options: { initialAnalysisLoaded?: boolean; refreshAnalysisAfterMutation?: boolean } = {}
) {
  const router = useRouter();
  const bootstrap = useCollectionBootstrap();
  const { t } = useLocaleContext();
  const tRef = useRef(t);
  tRef.current = t;
  const initialItems = initialProducts ?? [];
  const [closetProducts, setClosetProducts] = useState<Product[]>(initialItems);
  const [closetIds, setClosetIds] = useState<Set<string>>(new Set(initialItems.map((product) => product.id)));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(initialProducts !== undefined);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ClosetToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(initialProducts !== undefined);
  const hasAnalysisLoadedRef = useRef(Boolean(options.initialAnalysisLoaded));
  const refreshAnalysisAfterMutation = options.refreshAnalysisAfterMutation === true;
  const analysisRequestedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const showToast = useCallback((nextToast: ClosetToast) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(nextToast);
    if (nextToast) {
      toastTimerRef.current = setTimeout(() => setToast(null), 2300);
    }
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const load = useCallback(async (includeAnalysis = false) => {
    if (includeAnalysis) analysisRequestedRef.current = true;
    if (!isLoggedIn) {
      setClosetProducts([]);
      setClosetIds(new Set());
      hasLoadedRef.current = false;
      setIsLoaded(false);
      setError(null);
      hasAnalysisLoadedRef.current = false;
      analysisRequestedRef.current = false;
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    let requestedAnalysis = false;
    try {
      requestedAnalysis = includeAnalysis || hasAnalysisLoadedRef.current;
      const products = requestedAnalysis ? await fetchClosetItems(true) : (await bootstrap.ensure()).closet;
      setClosetProducts(products);
      setClosetIds(new Set(products.map((p) => p.id)));
      hasLoadedRef.current = true;
      setIsLoaded(true);
      setError(null);
      if (requestedAnalysis) {
        hasAnalysisLoadedRef.current = true;
        analysisRequestedRef.current = false;
      }
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : tRef.current("closet.loadError"));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      if (analysisRequestedRef.current && !requestedAnalysis) {
        window.setTimeout(() => void load(true), 0);
      }
    }
  }, [bootstrap, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) void load();
  }, [isLoggedIn, load]);

  const ensureLoaded = useCallback((includeAnalysis = false) => {
    if (!isLoggedIn || (hasLoadedRef.current && (!includeAnalysis || hasAnalysisLoadedRef.current))) return;
    void load(includeAnalysis);
  }, [isLoggedIn, load]);

  const hydrate = useCallback((products: Product[]) => {
    setClosetProducts(products);
    setClosetIds(new Set(products.map((product) => product.id)));
    hasLoadedRef.current = true;
    setIsLoaded(true);
    setError(null);
  }, []);

  const addToCloset = useCallback(async (productId: string, sizeSelection?: ClosetSizeSelection | null) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (closetIds.has(productId)) return;
    await apiAdd(productId, sizeSelection);
    bootstrap.invalidate();
    setClosetIds((prev) => new Set([...prev, productId]));
    if (refreshAnalysisAfterMutation) await load(true);
  }, [bootstrap, closetIds, isLoggedIn, load, refreshAnalysisAfterMutation, router]);

  const removeFromCloset = useCallback(async (productId: string) => {
    await apiRemove(productId);
    bootstrap.invalidate();
    setClosetIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setClosetProducts((prev) => prev.filter((p) => p.id !== productId));
    if (refreshAnalysisAfterMutation) await load(true);
  }, [bootstrap, load, refreshAnalysisAfterMutation]);

  const isInCloset = useCallback((productId: string) => closetIds.has(productId), [closetIds]);

  const toggleCloset = useCallback(async (productId: string, sizeSelection?: ClosetSizeSelection | null) => {
    if (!isLoggedIn) {
      router.push("/login");
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
  }, [isLoggedIn, router, closetIds, addToCloset, showToast]);

  return { closetProducts, closetIds, isLoading, isLoaded, error, toast, clearToast, addToCloset, removeFromCloset, isInCloset, toggleCloset, reload: load, ensureLoaded, hydrate };
}
