import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";

/**
 * Verifies a Bearer token using the anon key client.
 * Returns the user if valid, null otherwise.
 */
export async function verifyBearerToken(token) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // A server-side client has no persisted session. Pass the caller's token
  // directly so a valid signed-in user is not mistaken for an anonymous one.
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function verifyRegisteredBearerToken(token) {
  const user = await verifyBearerToken(token);
  if (!user?.id) return null;

  assertSupabaseConfig();
  const { data, error } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data?.id) return null;
  return { ...user, appUsername: data.username };
}
