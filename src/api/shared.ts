import { supabase } from "../lib/supabase";

export interface ApiEnvelope<T> {
  ok?: boolean;
  error?: string;
  data?: T;
}

export const getAuthHeaders = async (headers?: HeadersInit): Promise<Headers> => {
  const result = new Headers(headers);
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  const accessToken = data.session?.access_token;
  if (accessToken) result.set("Authorization", `Bearer ${accessToken}`);
  return result;
};

export const authenticatedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, {
    ...init,
    credentials: init.credentials ?? "same-origin",
    headers: await getAuthHeaders(init.headers),
  });

export const parseApiJson = async <T,>(response: Response, endpoint: string): Promise<T> => {
  const rawText = await response.text();
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    const preview = rawText.slice(0, 120).replace(/\s+/g, " ").trim();
    throw new Error(`${endpoint} returned non-JSON response (${response.status}). ${preview}`);
  }

  try {
    return JSON.parse(rawText);
  } catch {
    const preview = rawText.slice(0, 120).replace(/\s+/g, " ").trim();
    throw new Error(`${endpoint} returned invalid JSON (${response.status}). ${preview}`);
  }
};

export const postJson = async <TRequest, TResponse>(
  endpoint: string,
  body: TRequest,
  extraHeaders?: Record<string, string>
): Promise<{ response: Response; payload: ApiEnvelope<TResponse> }> => {
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: await getAuthHeaders({ "Content-Type": "application/json", ...extraHeaders }),
    body: JSON.stringify(body),
  });
  const payload = await parseApiJson<ApiEnvelope<TResponse>>(response, endpoint);
  return { response, payload };
};
