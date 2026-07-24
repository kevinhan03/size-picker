import { assertSupabaseClient, supabase } from "../lib/supabase";
import { parseApiJson } from "./shared";

async function getAccessToken() {
  assertSupabaseClient();
  const { data: { session } } = await supabase!.auth.getSession();
  const token = String(session?.access_token || "").trim();
  if (!token) throw new Error("Authentication is required");
  return token;
}

export async function checkUsernameAvailability(username: string) {
  const token = await getAccessToken();
  const response = await fetch(`/api/auth/username/availability?username=${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { available?: boolean; reason?: string | null }; error?: string }>(response, "/api/auth/username/availability");
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "사용자 이름을 확인하지 못했어요.");
  return { available: Boolean(payload.data?.available), reason: payload.data?.reason || null };
}

export async function fetchUsernameSuggestions() {
  const token = await getAccessToken();
  const response = await fetch("/api/auth/username/suggestions", { headers: { Authorization: `Bearer ${token}` } });
  const payload = await parseApiJson<{ ok?: boolean; data?: { suggestions?: unknown[] }; error?: string }>(response, "/api/auth/username/suggestions");
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "추천 사용자 이름을 불러오지 못했어요.");
  return (payload.data?.suggestions || []).map((value) => String(value)).filter(Boolean);
}

export async function changeMyUsername(username: string) {
  const token = await getAccessToken();
  const response = await fetch("/api/auth/username", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { username?: string; changed?: boolean }; error?: string }>(response, "/api/auth/username");
  if (!response.ok || !payload?.ok || !payload.data?.username) throw new Error(payload?.error || "사용자 이름을 변경하지 못했어요.");
  return { username: payload.data.username, changed: Boolean(payload.data.changed) };
}
