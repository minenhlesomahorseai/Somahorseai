import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserRole } from "@/lib/auth/types";

import { sendClientWelcome, sendTalentWelcome } from ".";

/**
 * Sends the role-appropriate welcome email exactly once, on the user's first
 * visit to their onboarding page. Best-effort: if email isn't configured the
 * flag stays false so it retries on a later visit once a key is added.
 */
export async function ensureWelcomeEmail(opts: {
  supabase: SupabaseClient;
  table: "client_onboarding" | "talent_onboarding";
  userId: string;
  role: UserRole;
  email: string | null;
  firstName: string | null;
  alreadySent: boolean;
}): Promise<void> {
  if (opts.alreadySent || !opts.email) return;

  const result =
    opts.role === "client"
      ? await sendClientWelcome({ to: opts.email, firstName: opts.firstName })
      : await sendTalentWelcome({ to: opts.email, firstName: opts.firstName });

  if (result.sent) {
    await opts.supabase
      .from(opts.table)
      .update({ welcome_email_sent: true })
      .eq("id", opts.userId);
  }
}
