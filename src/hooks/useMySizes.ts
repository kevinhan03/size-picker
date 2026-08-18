import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMySize as apiCreate,
  deleteMySize as apiDelete,
  updateMySize as apiUpdate,
} from "../api";
import type { MySizeInput, MySizeProfile, MySizeUpdateInput } from "../types";
import { useCollectionBootstrap } from "../contexts/CollectionBootstrapContext";

export function useMySizes(isLoggedIn: boolean, initialProfiles?: MySizeProfile[]) {
  const bootstrap = useCollectionBootstrap();
  const [mySizes, setMySizes] = useState<MySizeProfile[]>(initialProfiles ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(initialProfiles !== undefined);
  const isLoadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setMySizes([]);
      setError(null);
      hasLoadedRef.current = false;
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const profiles = (await bootstrap.ensure()).profiles;
      setMySizes(profiles);
      setError(null);
      hasLoadedRef.current = true;
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load my sizes");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [bootstrap, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) void load();
  }, [isLoggedIn, load]);

  const ensureLoaded = useCallback(() => {
    if (!isLoggedIn || hasLoadedRef.current) return;
    void load();
  }, [isLoggedIn, load]);

  const createMySize = useCallback(async (input: MySizeInput) => {
    const profile = await apiCreate(input);
    bootstrap.invalidate();
    setMySizes((prev) => [profile, ...prev]);
    return profile;
  }, [bootstrap]);

  const updateMySize = useCallback(async (id: string, input: MySizeUpdateInput) => {
    const profile = await apiUpdate(id, input);
    bootstrap.invalidate();
    setMySizes((prev) => prev.map((item) => (item.id === id ? profile : item)));
    return profile;
  }, [bootstrap]);

  const deleteMySize = useCallback(async (id: string) => {
    await apiDelete(id);
    bootstrap.invalidate();
    setMySizes((prev) => prev.filter((item) => item.id !== id));
  }, [bootstrap]);

  return {
    mySizes,
    isLoading,
    error,
    createMySize,
    updateMySize,
    deleteMySize,
    ensureLoaded,
    reload: load,
  };
}
