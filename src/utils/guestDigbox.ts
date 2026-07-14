export const GUEST_DIGBOX_KEY = "digbox_guest_v1";
export const GUEST_DIGBOX_LIMIT = 3;
const GUEST_DIGBOX_IMPORT_REQUEST_KEY = "digbox_guest_import_requested_v1";
const GUEST_DIGBOX_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type GuestDigboxPayload = {
  ids: string[];
  updatedAt: string;
};

const normalizeIds = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, GUEST_DIGBOX_LIMIT);
};

export function readGuestDigbox(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_DIGBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<GuestDigboxPayload>;
    const updatedAt = Date.parse(String(parsed.updatedAt || ""));
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > GUEST_DIGBOX_MAX_AGE_MS) {
      try {
        localStorage.removeItem(GUEST_DIGBOX_KEY);
      } catch {
        // Ignore restricted browser storage environments.
      }
      return [];
    }
    return normalizeIds(parsed.ids);
  } catch {
    try {
      localStorage.removeItem(GUEST_DIGBOX_KEY);
    } catch {
      // Ignore restricted browser storage environments.
    }
    return [];
  }
}

export function writeGuestDigbox(ids: string[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeIds(ids);
  try {
    if (!normalized.length) {
      localStorage.removeItem(GUEST_DIGBOX_KEY);
      return;
    }
    const payload: GuestDigboxPayload = { ids: normalized, updatedAt: new Date().toISOString() };
    localStorage.setItem(GUEST_DIGBOX_KEY, JSON.stringify(payload));
  } catch {
    // Keep the in-memory guest collection usable when persistence is blocked.
  }
}

export function requestGuestDigboxImport() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(GUEST_DIGBOX_IMPORT_REQUEST_KEY, "1");
  } catch {
    // The guest collection remains available even when session storage is unavailable.
  }
}

export function isGuestDigboxImportRequested() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(GUEST_DIGBOX_IMPORT_REQUEST_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearGuestDigboxImportRequest() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(GUEST_DIGBOX_IMPORT_REQUEST_KEY);
  } catch {
    // Ignore restricted browser storage environments.
  }
}
