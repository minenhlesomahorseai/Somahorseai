import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Admin access is governed by the `public.admins` allow-list table (seeded in
 * the onboarding migration). `ADMIN_EMAILS` can be set as an additional comma
 * separated allow-list, but DB-level access still requires the address to be
 * present in `public.admins` for row-level security to grant cross-user reads.
 */
export function getAdminEmailsFromEnv(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminUser(
  supabase: SupabaseClient,
  user: User | null
): Promise<boolean> {
  if (!user?.email) {
    return false;
  }

  const email = user.email.toLowerCase();
  if (getAdminEmailsFromEnv().includes(email)) {
    return true;
  }

  const { data } = await supabase
    .from("admins")
    .select("email")
    .ilike("email", email)
    .maybeSingle();

  return Boolean(data);
}
