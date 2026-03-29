import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "../config/env.js";

export const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export const assertSupabaseConfig = () => {
  if (!supabase) {
    const error = new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in server .env");
    error.statusCode = 500;
    throw error;
  }
};
