import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMySize as apiCreate,
  deleteMySize as apiDelete,
  fetchMySizes,
  updateMySize as apiUpdate,
} from "../api";
import type { MySizeInput, MySizeProfile, MySizeUpdateInput } from "../types";

export function useMySizes(isLoggedIn: boolean) {
  const [mySizes, setMySizes] = useState<MySizeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
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
      const profiles = await fetchMySizes();
      setMySizes(profiles);
      setError(null);
      hasLoadedRef.current = true;
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load my sizes");
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

  const createMySize = useCallback(async (input: MySizeInput) => {
    const profile = await apiCreate(input);
    setMySizes((prev) => [profile, ...prev]);
    return profile;
  }, []);

  const updateMySize = useCallback(async (id: string, input: MySizeUpdateInput) => {
    const profile = await apiUpdate(id, input);
    setMySizes((prev) => prev.map((item) => (item.id === id ? profile : item)));
    return profile;
  }, []);

  const deleteMySize = useCallback(async (id: string) => {
    await apiDelete(id);
    setMySizes((prev) => prev.filter((item) => item.id !== id));
  }, []);

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
