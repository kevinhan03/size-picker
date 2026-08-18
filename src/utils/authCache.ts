import type { AuthInitialState } from "../types";

const TTL_MS = 60_000;
const KEY = "digbox:auth:v1";

type AuthSnapshot = AuthInitialState & { expiresAt: number };

export function readAuthSnapshot(): AuthInitialState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || "") as Partial<AuthSnapshot>;
    if (!value.user?.id || !Number.isFinite(value.expiresAt) || Number(value.expiresAt) <= Date.now()) return null;
    return {
      user: { id: String(value.user.id), email: value.user.email ? String(value.user.email) : undefined },
      username: value.username ? String(value.username) : null,
      needsUsername: Boolean(value.needsUsername),
    };
  } catch {
    return null;
  }
}

export function writeAuthSnapshot(state: AuthInitialState) {
  if (typeof window === "undefined" || !state.user?.id) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...state, expiresAt: Date.now() + TTL_MS }));
  } catch {
    // Session storage is an optional UI acceleration layer.
  }
}

export function clearAuthSnapshot() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Best-effort cleanup.
  }
}
