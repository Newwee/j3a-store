import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing from environment variables.');
}

const globalForSupabase = globalThis as unknown as {
  supabaseInstance?: SupabaseClient;
};

export const supabase =
  globalForSupabase.supabaseInstance ??
  createBrowserClient(supabaseUrl, supabaseAnonKey);

globalForSupabase.supabaseInstance = supabase;
