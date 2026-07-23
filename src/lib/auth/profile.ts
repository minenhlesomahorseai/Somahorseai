import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "./types";

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, onboarding_status, preferred_currency, country_code"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}
