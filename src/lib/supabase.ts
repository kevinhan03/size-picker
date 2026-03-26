import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const assertSupabaseClient = () => {
  if (!supabase) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing');
  }
};
