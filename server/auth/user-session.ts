import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { AuthInitialState } from "../../src/types";
import { supabase as adminSupabase } from "../lib/supabase.js";

const ANONYMOUS_AUTH: AuthInitialState = { user: null, username: null, needsUsername: false };

async function loadInitialAuthState(): Promise<AuthInitialState> {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  if (!hasAuthCookie) return ANONYMOUS_AUTH;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return ANONYMOUS_AUTH;

  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // Server Components cannot mutate cookies. proxy.ts performs refreshes.
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  const user = data.user;
  if (error || !user?.id) return ANONYMOUS_AUTH;

  const { data: profile } = adminSupabase
    ? await adminSupabase.from("users").select("username").eq("id", user.id).maybeSingle()
    : { data: null };
  return {
    user: { id: user.id, email: user.email },
    username: profile?.username ? String(profile.username) : null,
    needsUsername: !profile?.username,
  };
}

export const getInitialAuthState = cache(loadInitialAuthState);
