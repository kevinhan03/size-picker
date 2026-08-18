"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { fetchCollectionsBootstrap, type CollectionBootstrapData } from "../api";
import { clearCollectionSnapshot, readCollectionSnapshot, writeCollectionSnapshot } from "../utils/collectionCache";
import { useAuthContext } from "./AuthContext";

type CollectionBootstrapValue = { ensure: () => Promise<CollectionBootstrapData>; invalidate: () => void };
const CollectionBootstrapContext = createContext<CollectionBootstrapValue | null>(null);
type InFlightBootstrap = { userId: string; version: number; promise: Promise<CollectionBootstrapData> };

export function CollectionBootstrapProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuthContext();
  const userId = authUser?.id || "";
  const requestRef = useRef<InFlightBootstrap | null>(null);
  const cacheVersionRef = useRef(0);
  const userIdRef = useRef(userId);

  useEffect(() => {
    if (userIdRef.current && userIdRef.current !== userId) clearCollectionSnapshot(userIdRef.current);
    userIdRef.current = userId;
    cacheVersionRef.current += 1;
    requestRef.current = null;
  }, [userId]);

  const ensure = useCallback(async () => {
    if (!userId) throw new Error("logged-in user required");
    const cached = readCollectionSnapshot(userId);
    if (cached) return { closet: cached.closet, digbox: cached.digbox, profiles: cached.profiles };
    const version = cacheVersionRef.current;
    const inFlight = requestRef.current;
    if (inFlight && inFlight.userId === userId && inFlight.version === version) return inFlight.promise;

    const promise = fetchCollectionsBootstrap().then((data) => {
      if (userIdRef.current === userId && cacheVersionRef.current === version) writeCollectionSnapshot(userId, data);
      return data;
    }).finally(() => {
      if (requestRef.current?.promise === promise) requestRef.current = null;
    });
    requestRef.current = { userId, version, promise };
    return promise;
  }, [userId]);

  const invalidate = useCallback(() => {
    if (userId) clearCollectionSnapshot(userId);
    cacheVersionRef.current += 1;
    requestRef.current = null;
  }, [userId]);

  return <CollectionBootstrapContext.Provider value={{ ensure, invalidate }}>{children}</CollectionBootstrapContext.Provider>;
}

export function useCollectionBootstrap() {
  const context = useContext(CollectionBootstrapContext);
  if (!context) throw new Error("useCollectionBootstrap must be used within CollectionBootstrapProvider");
  return context;
}
