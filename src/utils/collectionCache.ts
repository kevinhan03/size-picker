import type { MySizeProfile, Product } from "../types";

const TTL_MS = 60_000;
const PREFIX = "digbox:collections:v4:";

export type CollectionSnapshot = {
  expiresAt: number;
  closet: Product[];
  digbox: { products: Product[]; discoveredDigboxCounts: Record<string, number> };
  profiles: MySizeProfile[];
};

function key(userId: string) {
  return `${PREFIX}${userId}`;
}

export function readCollectionSnapshot(userId: string): CollectionSnapshot | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(key(userId)) || "") as Partial<CollectionSnapshot>;
    if (!value || Number(value.expiresAt) <= Date.now() || !Array.isArray(value.closet) || !Array.isArray(value.profiles) || !value.digbox || !Array.isArray(value.digbox.products)) return null;
    return value as CollectionSnapshot;
  } catch {
    return null;
  }
}

export function writeCollectionSnapshot(userId: string, data: Omit<CollectionSnapshot, "expiresAt">) {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.setItem(key(userId), JSON.stringify({ ...data, expiresAt: Date.now() + TTL_MS }));
  } catch {
    // Storage can be unavailable or full; the in-memory request dedupe still applies.
  }
}

export function clearCollectionSnapshot(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.removeItem(key(userId));
  } catch {
    // Best-effort cleanup for browsers that block session storage.
  }
}
