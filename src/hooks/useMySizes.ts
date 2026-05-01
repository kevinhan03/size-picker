import { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setMySizes([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    try {
      const profiles = await fetchMySizes();
      setMySizes(profiles);
      setError(null);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load my sizes");
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setTimeout(() => void load(), 0);
  }, [load]);

  const createMySize = useCallback(async (input: MySizeInput) => {
    const profile = await apiCreate(input);
    setMySizes((prev) => {
      const cleared = profile.isDefault
        ? prev.map((item) => (item.category === profile.category ? { ...item, isDefault: false } : item))
        : prev;
      return [profile, ...cleared];
    });
    return profile;
  }, []);

  const updateMySize = useCallback(async (id: string, input: MySizeUpdateInput) => {
    const profile = await apiUpdate(id, input);
    setMySizes((prev) =>
      prev.map((item) => {
        if (item.id === id) return profile;
        if (profile.isDefault && item.category === profile.category) return { ...item, isDefault: false };
        return item;
      })
    );
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
    reload: load,
  };
}
