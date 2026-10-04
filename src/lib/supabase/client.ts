import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'j3a_store_auth_token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

globalForSupabase.supabaseInstance = supabase;
