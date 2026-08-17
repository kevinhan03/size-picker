import type { OutfitRequestDetail, OutfitRequestMineStatus, OutfitRequestScope, OutfitRequestSummary } from "../types";
import { parseApiJson } from "./shared";

function authHeaders(includeJson = false) {
  return includeJson ? { "Content-Type": "application/json" } : undefined;
}

async function parseResponse<T>(response: Response, endpoint: string): Promise<T> {
  const payload = await parseApiJson<{ ok?: boolean; data?: T; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "요청을 처리하지 못했습니다.");
  return payload.data;
}

export async function fetchOutfitRequests(scope: OutfitRequestScope, cursor: string | null = null, mineStatus: OutfitRequestMineStatus = "all", signal?: AbortSignal) {
  const endpoint = `/api/outfit-requests?scope=${scope}&status=${mineStatus}&limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
  const response = await fetch(endpoint, { headers: authHeaders(), credentials: "same-origin", signal });
  return parseResponse<{
    requests: OutfitRequestSummary[];
    total: number;
    nextCursor: string | null;
    currentUserId: string | null;
  }>(response, endpoint);
}

export async function createOutfitRequest(input: { description: string; focusProductIds?: string[] }) {
  const endpoint = "/api/outfit-requests";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders(true), credentials: "same-origin",
    body: JSON.stringify(input),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function fetchOutfitRequest(id: string) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, { headers: authHeaders(), credentials: "same-origin" });
  return parseResponse<{ request: OutfitRequestDetail; currentUserId: string | null }>(response, endpoint);
}

export async function updateOutfitRequest(id: string, body: { action: "close" } | { action: "accept"; proposalId: string }) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: authHeaders(true), credentials: "same-origin",
    body: JSON.stringify(body),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function deleteOutfitRequest(id: string) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, { method: "DELETE", headers: authHeaders(), credentials: "same-origin" });
  return parseResponse<{ deleted: boolean }>(response, endpoint);
}

export async function createOutfitProposal(id: string, input: { productIds: string[]; explanation: string }) {
  const endpoint = `/api/outfit-requests/${encodeURIComponent(id)}/proposals`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders(true), credentials: "same-origin",
    body: JSON.stringify(input),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function updateOutfitProposal(id: string, input: { productIds: string[]; explanation: string }) {
  const endpoint = `/api/outfit-proposals/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: authHeaders(true), credentials: "same-origin",
    body: JSON.stringify(input),
  });
  return parseResponse<{ request: OutfitRequestDetail }>(response, endpoint);
}

export async function deleteOutfitProposal(id: string) {
  const endpoint = `/api/outfit-proposals/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, { method: "DELETE", headers: authHeaders(), credentials: "same-origin" });
  return parseResponse<{ deleted: boolean }>(response, endpoint);
}
