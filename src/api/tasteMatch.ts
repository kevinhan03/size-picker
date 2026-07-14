import { supabase, assertSupabaseClient } from "../lib/supabase";
import { type ApiEnvelope, parseApiJson } from "./shared";
import type { DigMatchAnswer, DigMatchProfile } from "../utils/digMatch";

export interface DigMatchHistoryEntry {
  completedAt: string;
  profile: DigMatchProfile;
}

async function getAccessToken() {
  assertSupabaseClient();
  const { data: { session } } = await supabase!.auth.getSession();
  return String(session?.access_token || "").trim();
}

export async function fetchDigMatchProfile(): Promise<DigMatchProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const response = await fetch("/api/taste-match/profile", { headers: { Authorization: `Bearer ${token}` } });
  const payload = await parseApiJson<ApiEnvelope<{ profile?: DigMatchProfile | null }>>(response, "/api/taste-match/profile");
  if (!response.ok || !payload.ok) throw new Error(payload.error || "취향 프로필을 불러오지 못했습니다.");
  return payload.data?.profile || null;
}

export async function fetchDigMatchHistory(): Promise<DigMatchHistoryEntry[]> {
  const token = await getAccessToken();
  if (!token) return [];
  const response = await fetch("/api/taste-match/profile", { headers: { Authorization: `Bearer ${token}` } });
  const payload = await parseApiJson<ApiEnvelope<{ history?: DigMatchHistoryEntry[] }>>(response, "/api/taste-match/profile");
  if (!response.ok || !payload.ok) return [];
  return Array.isArray(payload.data?.history) ? payload.data.history : [];
}

export async function saveDigMatchProfile(profile: DigMatchProfile, answers: DigMatchAnswer[]) {
  const token = await getAccessToken();
  if (!token) return false;
  const response = await fetch("/api/taste-match/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ profile, answers }),
  });
  const payload = await parseApiJson<ApiEnvelope<{ profile?: DigMatchProfile }>>(response, "/api/taste-match/profile");
  if (!response.ok || !payload.ok) throw new Error(payload.error || "취향 프로필을 저장하지 못했습니다.");
  return true;
}
