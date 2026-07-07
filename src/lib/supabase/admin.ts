import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS, so it is ONLY ever used in
 * trusted server code (server actions / route handlers) after the caller's
 * identity and ownership have been verified with a normal authed client.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured so callers can
 * degrade gracefully instead of crashing.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function serviceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
