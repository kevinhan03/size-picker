import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase as adminSupabase } from "../lib/supabase.js";
import { verifyBearerToken, verifyRegisteredBearerToken } from "../utils/verify-auth.js";

export type RegisteredRequestUser = {
  id: string;
  email?: string;
  appUsername: string;
};

export async function getRequestAuthUser(request: Request) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key && cookieStore.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"))) {
    const client = createServerClient(url, key, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } });
    const { data, error } = await client.auth.getUser();
    if (!error && data.user) return data.user;
  }
  const token = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return token ? verifyBearerToken(token) : null;
}

export async function getRegisteredRequestUser(request: Request): Promise<RegisteredRequestUser | null> {
  const verifiedUserId = String(request.headers.get("x-digbox-verified-user-id") || "").trim();
  if (verifiedUserId && adminSupabase) {
    const { data: profile, error: profileError } = await adminSupabase
      .from("users")
      .select("id, username")
      .eq("id", verifiedUserId)
      .maybeSingle();
    if (!profileError && profile?.id) {
      return { id: verifiedUserId, appUsername: String(profile.username || "") };
    }
  }

  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));

  if (hasAuthCookie) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const client = createServerClient(url, key, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {
            // proxy.ts refreshes cookies before protected page requests.
          },
        },
      });
      const { data, error } = await client.auth.getUser();
      if (!error && data.user?.id && adminSupabase) {
        const { data: profile, error: profileError } = await adminSupabase
          .from("users")
          .select("id, username")
          .eq("id", data.user.id)
          .maybeSingle();
        if (!profileError && profile?.id) {
          return {
            id: data.user.id,
            email: data.user.email,
            appUsername: String(profile.username || ""),
          };
        }
      }
    }
  }

  const token = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return verifyRegisteredBearerToken(token) as Promise<RegisteredRequestUser | null>;
}

export function hasValidMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
