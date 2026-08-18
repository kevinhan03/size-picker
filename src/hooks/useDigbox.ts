import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCatalogProductsByIds, fetchDigboxData, addToDigbox as apiAdd, removeFromDigbox as apiRemove } from "../api";
import { useCollectionBootstrap } from "../contexts/CollectionBootstrapContext";
import type { Product } from "../types";
import { captureEvent } from "../utils/analytics";
import {
  clearGuestDigboxImportRequest,
  GUEST_DIGBOX_LIMIT,
  isGuestDigboxImportRequested,
  readGuestDigbox,
  writeGuestDigbox,
} from "../utils/guestDigbox";

export type DigboxToast = { message: string; type: "success" | "info" | "error" } | null;
export type GuestSyncStatus = "idle" | "syncing" | "success" | "partial";

export function useDigbox(
  isLoggedIn: boolean,
  initialProducts?: Product[],
  initialCounts: Record<string, number> = {},
  options: { initialAnalysisLoaded?: boolean; refreshAnalysisAfterMutation?: boolean } = {}
) {
  const bootstrap = useCollectionBootstrap();
  const initialItems = initialProducts ?? [];
  const [digboxProducts, setDigboxProducts] = useState<Product[]>(initialItems);
  const [digboxIds, setDigboxIds] = useState<Set<string>>(new Set(initialItems.map((product) => product.id)));
  const [discoveredDigboxCounts, setDiscoveredDigboxCounts] = useState<Record<string, number>>(initialCounts);
  const [guestIds, setGuestIds] = useState<string[]>([]);
  const [guestProducts, setGuestProducts] = useState<Product[]>([]);
  const [isGuestHydrated, setIsGuestHydrated] = useState(false);
  const [isGuestPanelOpen, setIsGuestPanelOpen] = useState(false);
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [guestSyncStatus, setGuestSyncStatus] = useState<GuestSyncStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(initialProducts !== undefined);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<DigboxToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(initialProducts !== undefined);
  const hasAnalysisLoadedRef = useRef(Boolean(options.initialAnalysisLoaded));
  const refreshAnalysisAfterMutation = options.refreshAnalysisAfterMutation === true;
  const analysisRequestedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const syncAttemptedRef = useRef(false);

  const showToast = useCallback((nextToast: DigboxToast) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(nextToast);
    if (nextToast) toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  useEffect(() => {
    setGuestIds(readGuestDigbox());
    setIsGuestHydrated(true);
  }, []);

  useEffect(() => {
    if (!isGuestHydrated || isLoggedIn || !guestIds.length) {
      setGuestProducts([]);
      return;
    }
    const controller = new AbortController();
    void fetchCatalogProductsByIds(guestIds, controller.signal)
      .then((loaded) => {
        const validIds = new Set(loaded.map((product) => product.id));
        const nextIds = guestIds.filter((id) => validIds.has(id));
        if (nextIds.length !== guestIds.length) {
          writeGuestDigbox(nextIds);
          setGuestIds(nextIds);
        }
        setGuestProducts(loaded);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setGuestProducts([]);
      });
    return () => controller.abort();
  }, [guestIds, isGuestHydrated, isLoggedIn]);

  const load = useCallback(async (includeAnalysis = false) => {
    if (includeAnalysis) analysisRequestedRef.current = true;
    if (!isLoggedIn) {
      setDigboxProducts([]);
      setDigboxIds(new Set());
      setDiscoveredDigboxCounts({});
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
      const { products: loadedProducts, discoveredDigboxCounts: loadedCounts } = requestedAnalysis
        ? await fetchDigboxData(true)
        : (await bootstrap.ensure()).digbox;
      setDigboxProducts(loadedProducts);
      setDigboxIds(new Set(loadedProducts.map((product) => product.id)));
      setDiscoveredDigboxCounts(loadedCounts);
      hasLoadedRef.current = true;
      setIsLoaded(true);
      setError(null);
      if (requestedAnalysis) {
        hasAnalysisLoadedRef.current = true;
        analysisRequestedRef.current = false;
      }
    } catch (loadError: unknown) {
      // Keep the previous collection when a background refresh fails.
      setError(loadError instanceof Error ? loadError.message : "저장 목록을 불러오지 못했습니다.");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      if (analysisRequestedRef.current && !requestedAnalysis) {
        window.setTimeout(() => void load(true), 0);
      }
    }
  }, [bootstrap, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      syncAttemptedRef.current = false;
      setGuestSyncStatus("idle");
      void load();
    }
  }, [isLoggedIn, load]);

  const ensureLoaded = useCallback((includeAnalysis = false) => {
    if (!isLoggedIn || (hasLoadedRef.current && (!includeAnalysis || hasAnalysisLoadedRef.current))) return;
    void load(includeAnalysis);
  }, [isLoggedIn, load]);

  const hydrate = useCallback((products: Product[], counts: Record<string, number> = {}) => {
    setDigboxProducts(products);
    setDigboxIds(new Set(products.map((product) => product.id)));
    setDiscoveredDigboxCounts(counts);
    hasLoadedRef.current = true;
    setIsLoaded(true);
    setError(null);
  }, []);

  const addServerItem = useCallback(async (productId: string) => {
    await apiAdd(productId);
    bootstrap.invalidate();
    setDigboxIds((current) => new Set([...current, productId]));
  }, [bootstrap]);

  const syncGuestItems = useCallback(async () => {
    if (!isLoggedIn || !guestIds.length || syncAttemptedRef.current || !isGuestDigboxImportRequested()) return;
    syncAttemptedRef.current = true;
    setGuestSyncStatus("syncing");

    const failedIds: string[] = [];
    let succeeded = 0;
    for (const productId of guestIds.slice(0, GUEST_DIGBOX_LIMIT)) {
      try {
        await apiAdd(productId);
        succeeded += 1;
      } catch {
        failedIds.push(productId);
      }
    }

    writeGuestDigbox(failedIds);
    setGuestIds(failedIds);
    captureEvent("guest_digbox_sync_completed", {
      attempted_count: guestIds.length,
      succeeded_count: succeeded,
      failed_count: failedIds.length,
    });

    if (failedIds.length) {
      setGuestSyncStatus("partial");
      showToast({ message: "guest_sync_partial", type: "error" });
    } else {
      clearGuestDigboxImportRequest();
      setGuestSyncStatus("success");
      setIsGuestPanelOpen(false);
      setIsGuestPromptOpen(false);
      showToast({ message: "guest_synced", type: "success" });
    }
    await load();
  }, [guestIds, isLoggedIn, load, showToast]);

  useEffect(() => {
    if (isLoggedIn && isGuestHydrated && guestIds.length && !syncAttemptedRef.current && isGuestDigboxImportRequested()) {
      void syncGuestItems();
    }
  }, [guestIds.length, isGuestHydrated, isLoggedIn, syncGuestItems]);

  const retryGuestSync = useCallback(() => {
    syncAttemptedRef.current = false;
    setGuestSyncStatus("idle");
    void syncGuestItems();
  }, [syncGuestItems]);

  const addToDigbox = useCallback(async (productId: string, source = "unknown") => {
    if (!isLoggedIn || digboxIds.has(productId)) return;
    await addServerItem(productId);
    if (refreshAnalysisAfterMutation) await load(true);
    const properties = { product_id: productId, source, logged_in: true };
    captureEvent("server_digbox_save_completed", properties);
    captureEvent("save_succeeded", properties);
  }, [addServerItem, digboxIds, isLoggedIn, load, refreshAnalysisAfterMutation]);

  const removeFromDigbox = useCallback(async (productId: string) => {
    await apiRemove(productId);
    bootstrap.invalidate();
    setDigboxIds((current) => {
      const next = new Set(current);
      next.delete(productId);
      return next;
    });
    setDigboxProducts((current) => current.filter((product) => product.id !== productId));
    setDiscoveredDigboxCounts((current) => {
      if (!(productId in current)) return current;
      const next = { ...current };
      delete next[productId];
      return next;
    });
    if (refreshAnalysisAfterMutation) await load(true);
  }, [bootstrap, load, refreshAnalysisAfterMutation]);

  const removeGuestItem = useCallback((productId: string) => {
    setIsGuestPromptOpen(false);
    setGuestIds((current) => {
      const next = current.filter((id) => id !== productId);
      writeGuestDigbox(next);
      return next;
    });
  }, []);

  const isInDigbox = useCallback(
    (productId: string) => (isLoggedIn ? digboxIds.has(productId) : guestIds.includes(productId)),
    [digboxIds, guestIds, isLoggedIn]
  );

  const toggleDigbox = useCallback(async (productId: string, source = "unknown") => {
    captureEvent("save_clicked", {
      product_id: productId,
      source,
      logged_in: isLoggedIn,
      already_saved: isLoggedIn ? digboxIds.has(productId) : guestIds.includes(productId),
      guest_count: guestIds.length,
    });
    captureEvent("digbox_save_attempted", {
      product_id: productId,
      source,
      logged_in: isLoggedIn,
      guest_count: guestIds.length,
    });

    if (!isLoggedIn) {
      if (guestIds.includes(productId)) {
        showToast({ message: "already_added", type: "info" });
        return;
      }
      if (guestIds.length >= GUEST_DIGBOX_LIMIT) {
        captureEvent("guest_digbox_limit_reached", { product_id: productId, guest_count: guestIds.length, source });
        setIsGuestPromptOpen(true);
        return;
      }
      const next = [...guestIds, productId];
      setGuestIds(next);
      writeGuestDigbox(next);
      const properties = { product_id: productId, guest_count: next.length, source, logged_in: false };
      captureEvent("guest_digbox_saved", properties);
      captureEvent("save_succeeded", properties);
      if (next.length === GUEST_DIGBOX_LIMIT) {
        setIsGuestPromptOpen(true);
      }
      return;
    }

    if (digboxIds.has(productId)) {
      showToast({ message: "already_added", type: "info" });
      return;
    }
    try {
      await addToDigbox(productId, source);
      showToast({ message: "added", type: "success" });
    } catch (error) {
      console.error("[digbox] add failed", error);
      showToast({ message: "add_failed", type: "error" });
    }
  }, [addToDigbox, digboxIds, guestIds, isLoggedIn, showToast]);

  return {
    digboxProducts,
    digboxIds,
    discoveredDigboxCounts,
    isLoading,
    isLoaded,
    error,
    toast,
    clearToast,
    addToDigbox,
    removeFromDigbox,
    isInDigbox,
    toggleDigbox,
    reload: load,
    ensureLoaded,
    hydrate,
    guestIds,
    guestProducts,
    guestCount: guestIds.length,
    guestLimit: GUEST_DIGBOX_LIMIT,
    isGuestHydrated,
    isGuestPanelOpen,
    setIsGuestPanelOpen,
    isGuestPromptOpen,
    setIsGuestPromptOpen,
    removeGuestItem,
    guestSyncStatus,
    retryGuestSync,
  };
}
