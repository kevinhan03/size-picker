import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const assertSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase public env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
};
