import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchDigboxData, addToDigbox as apiAdd, removeFromDigbox as apiRemove } from "../api";
import type { Product } from "../types";
import { captureEvent } from "../utils/analytics";
import { GUEST_DIGBOX_LIMIT, readGuestDigbox, writeGuestDigbox } from "../utils/guestDigbox";

export type DigboxToast = { message: string; type: "success" | "info" | "error" } | null;
export type GuestSyncStatus = "idle" | "syncing" | "success" | "partial";

export function useDigbox(isLoggedIn: boolean, products: Product[] = []) {
  const [digboxProducts, setDigboxProducts] = useState<Product[]>([]);
  const [digboxIds, setDigboxIds] = useState<Set<string>>(new Set());
  const [discoveredDigboxCounts, setDiscoveredDigboxCounts] = useState<Record<string, number>>({});
  const [guestIds, setGuestIds] = useState<string[]>([]);
  const [isGuestHydrated, setIsGuestHydrated] = useState(false);
  const [isGuestPanelOpen, setIsGuestPanelOpen] = useState(false);
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [guestSyncStatus, setGuestSyncStatus] = useState<GuestSyncStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<DigboxToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
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
    if (!isGuestHydrated || !products.length || isLoggedIn) return;
    const validIds = new Set(products.map((product) => product.id));
    setGuestIds((current) => {
      const next = current.filter((id) => validIds.has(id));
      if (next.length !== current.length) writeGuestDigbox(next);
      return next.length === current.length ? current : next;
    });
  }, [isGuestHydrated, isLoggedIn, products]);

  const guestProducts = useMemo(() => {
    const productById = new Map(products.map((product) => [product.id, product]));
    return guestIds.map((id) => productById.get(id)).filter((product): product is Product => Boolean(product));
  }, [guestIds, products]);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setDigboxProducts([]);
      setDigboxIds(new Set());
      setDiscoveredDigboxCounts({});
      hasLoadedRef.current = false;
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { products: loadedProducts, discoveredDigboxCounts: loadedCounts } = await fetchDigboxData();
      setDigboxProducts(loadedProducts);
      setDigboxIds(new Set(loadedProducts.map((product) => product.id)));
      setDiscoveredDigboxCounts(loadedCounts);
      hasLoadedRef.current = true;
    } catch {
      // Keep the previous collection when a background refresh fails.
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      syncAttemptedRef.current = false;
      setGuestSyncStatus("idle");
      void load();
    }
  }, [isLoggedIn, load]);

  const ensureLoaded = useCallback(() => {
    if (!isLoggedIn || hasLoadedRef.current) return;
    void load();
  }, [isLoggedIn, load]);

  const addServerItem = useCallback(async (productId: string) => {
    await apiAdd(productId);
    setDigboxIds((current) => new Set([...current, productId]));
  }, []);

  const syncGuestItems = useCallback(async () => {
    if (!isLoggedIn || !guestIds.length || syncAttemptedRef.current) return;
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
      setGuestSyncStatus("success");
      setIsGuestPanelOpen(false);
      setIsGuestPromptOpen(false);
      showToast({ message: "guest_synced", type: "success" });
    }
    await load();
  }, [guestIds, isLoggedIn, load, showToast]);

  useEffect(() => {
    if (isLoggedIn && isGuestHydrated && guestIds.length && !syncAttemptedRef.current) {
      void syncGuestItems();
    }
  }, [guestIds.length, isGuestHydrated, isLoggedIn, syncGuestItems]);

  const retryGuestSync = useCallback(() => {
    syncAttemptedRef.current = false;
    setGuestSyncStatus("idle");
    void syncGuestItems();
  }, [syncGuestItems]);

  const addToDigbox = useCallback(async (productId: string) => {
    if (!isLoggedIn || digboxIds.has(productId)) return;
    await addServerItem(productId);
    captureEvent("server_digbox_save_completed", { product_id: productId, logged_in: true });
    void load();
  }, [addServerItem, digboxIds, isLoggedIn, load]);

  const removeFromDigbox = useCallback(async (productId: string) => {
    await apiRemove(productId);
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
  }, []);

  const removeGuestItem = useCallback((productId: string) => {
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
      captureEvent("guest_digbox_saved", { product_id: productId, guest_count: next.length, source });
      showToast({ message: `guest_added_${next.length}`, type: "success" });
      if (next.length === GUEST_DIGBOX_LIMIT) setIsGuestPromptOpen(true);
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
  }, [addToDigbox, digboxIds, guestIds, isLoggedIn, showToast]);

  return {
    digboxProducts,
    digboxIds,
    discoveredDigboxCounts,
    isLoading,
    toast,
    clearToast,
    addToDigbox,
    removeFromDigbox,
    isInDigbox,
    toggleDigbox,
    reload: load,
    ensureLoaded,
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
