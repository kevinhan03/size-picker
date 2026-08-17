import { parseApiJson } from "./shared";
import { apiMessage } from "./apiMessage";

export async function checkUsernameAvailability(username: string) {
  const response = await fetch(`/api/auth/username/availability?username=${encodeURIComponent(username)}`, {
    credentials: "same-origin",
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { available?: boolean; reason?: string | null }; error?: string }>(response, "/api/auth/username/availability");
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('usernameAvailabilityFailed'));
  return { available: Boolean(payload.data?.available), reason: payload.data?.reason || null };
}

export async function fetchUsernameSuggestions() {
  const response = await fetch("/api/auth/username/suggestions", { credentials: "same-origin" });
  const payload = await parseApiJson<{ ok?: boolean; data?: { suggestions?: unknown[] }; error?: string }>(response, "/api/auth/username/suggestions");
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('usernameSuggestionsFailed'));
  return (payload.data?.suggestions || []).map((value) => String(value)).filter(Boolean);
}

export async function changeMyUsername(username: string) {
  const response = await fetch("/api/auth/username", {
    method: "PATCH",
    credentials: "same-origin", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { username?: string; changed?: boolean }; error?: string }>(response, "/api/auth/username");
  if (!response.ok || !payload?.ok || !payload.data?.username) throw new Error(payload?.error || apiMessage('usernameChangeFailed'));
  return { username: payload.data.username, changed: Boolean(payload.data.changed) };
}
