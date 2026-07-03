import { createClient, SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabaseAnon(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!anonClient) anonClient = createClient(url, key);
  return anonClient;
}

/** Server-only — for ingest sync (bypasses RLS). */
export function getSupabaseService(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!serviceClient) serviceClient = createClient(url, key);
  return serviceClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseAnon());
}
