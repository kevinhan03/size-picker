export type AuthIntent = "login" | "signup";

export type AuthContinuation = {
  intent: AuthIntent;
  returnTo: string;
  source: string;
  method?: "email" | "google";
};

const AUTH_CONTINUATION_KEY = "digbox_auth_flow_v1";

export function sanitizeReturnTo(value: string | null | undefined): string {
  const candidate = String(value || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "/";
  try {
    const parsed = new URL(candidate, "https://digbox.local");
    return parsed.origin === "https://digbox.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/";
  } catch {
    return "/";
  }
}

export function saveAuthContinuation(input: AuthContinuation) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      AUTH_CONTINUATION_KEY,
      JSON.stringify({ ...input, returnTo: sanitizeReturnTo(input.returnTo) })
    );
  } catch {
    // Authentication must still work when browser storage is unavailable.
  }
}

export function readAuthContinuation(): AuthContinuation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_CONTINUATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthContinuation>;
    const intent = parsed.intent === "signup" ? "signup" : parsed.intent === "login" ? "login" : null;
    if (!intent) return null;
    return {
      intent,
      returnTo: sanitizeReturnTo(parsed.returnTo),
      source: String(parsed.source || "direct"),
      method: parsed.method === "google" ? "google" : parsed.method === "email" ? "email" : undefined,
    };
  } catch {
    return null;
  }
}

export function clearAuthContinuation() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_CONTINUATION_KEY);
  } catch {
    // Ignore restricted browser storage environments.
  }
}

export function buildLoginHref(intent: AuthIntent, returnTo: string): string {
  const params = new URLSearchParams({ intent, returnTo: sanitizeReturnTo(returnTo) });
  return `/login?${params.toString()}`;
}
