export async function getAccessToken(required = false): Promise<string> {
  const { supabase, assertSupabaseClient } = await import("../lib/supabase");
  if (required) assertSupabaseClient();
  if (!supabase) return "";
  const { data, error } = await supabase.auth.getSession();
  if (error && required) throw new Error("Authentication is required");
  const token = String(data.session?.access_token || "").trim();
  if (!token && required) throw new Error("Authentication is required");
  return token;
}

export async function getAuthHeaders(includeJson = false): Promise<Record<string, string>> {
  const token = await getAccessToken(true);
  return {
    Authorization: `Bearer ${token}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}
