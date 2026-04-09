import { createClient } from "@supabase/supabase-js";

/**
 * Verifies a Bearer token using the anon key client.
 * Returns the user if valid, null otherwise.
 */
export async function verifyBearerToken(token) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
}
