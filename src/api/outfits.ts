import { supabase } from "../lib/supabase";
import type { OutfitRequestDetail, OutfitRequestMineStatus, OutfitRequestScope, OutfitRequestSummary } from "../types";
import { parseApiJson } from "./shared";

async function authHeaders(includeJson = false) {
  const { data } = await supabase!.auth.getSession();
  const token = String(data.session?.access_token || "").trim();
  if (!token) throw new Error("로그인이 필요합니다.");
  return {
    Authorization: `Bearer ${token}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

async function parseResponse<T>(response: Response, endpoint: string): Promise<T> {
  const payload = await parseApiJson<{ ok?: boolean; data?: T; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "요청을 처리하지 못했습니다.");
  return payload.data;
}

export async function fetchOutfitRequests(scope: OutfitRequestScope, offset = 0, mineStatus: OutfitRequestMineStatus = "all") {
  const endpoint = `/api/outfit-requests?scope=${scope}&status=${mineStatus}&offset=${offset}&limit=20`;
  const response = await fetch(endpoint, { headers: await authHeaders() });
  return parseResponse<{
    requests: OutfitRequestSummary[];
    total: number;
    nextOffset: number;
    currentUserId: string;
  }>(response, endpoint);
}

export async function createOutfitRequest(input: { description: string; focusProductIds?: string[] }) {
  const endpoint = "/api/outfit-requests";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify(input),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function fetchOutfitRequest(id: string) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, { headers: await authHeaders() });
  return parseResponse<{ request: OutfitRequestDetail; currentUserId: string }>(response, endpoint);
}

export async function updateOutfitRequest(id: string, body: { action: "close" } | { action: "accept"; proposalId: string }) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: await authHeaders(true),
    body: JSON.stringify(body),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function deleteOutfitRequest(id: string) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, { method: "DELETE", headers: await authHeaders() });
  return parseResponse<{ deleted: boolean }>(response, endpoint);
}

export async function createOutfitProposal(id: string, input: { productIds: string[]; explanation: string }) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}/proposals`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify(input),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function updateOutfitProposal(id: string, input: { productIds: string[]; explanation: string }) {
  const endpoint = `/api/outfit-proposals/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: await authHeaders(true),
    body: JSON.stringify(input),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function deleteOutfitProposal(id: string) {
  const endpoint = `/api/outfit-proposals/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, { method: "DELETE", headers: await authHeaders() });
  return parseResponse<{ deleted: boolean }>(response, endpoint);
}
