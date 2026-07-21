import type { SupabaseClient } from "@supabase/supabase-js";

import type { ClientOnboarding, TalentOnboarding } from "@/lib/auth/types";

const CLIENT_COLUMNS =
  "id, current_step, company_name, sector, project_type, problem, timeline, budget_range, submitted, welcome_email_sent";

const TALENT_COLUMNS =
  "id, current_step, stage, headline, primary_role, years_experience, skills, bio, portfolio_url, github_url, country, agri_experience, assessment, admin_notes, welcome_email_sent, availability_status";

export async function fetchClientOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<ClientOnboarding | null> {
  const { data } = await supabase
    .from("client_onboarding")
    .select(CLIENT_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  return (data as ClientOnboarding | null) ?? null;
}

export async function getOrCreateClientOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<ClientOnboarding> {
  const existing = await fetchClientOnboarding(supabase, userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("client_onboarding")
    .insert({ id: userId })
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      const existingAfterRace = await fetchClientOnboarding(supabase, userId);
      if (existingAfterRace) {
        return existingAfterRace;
      }
    }
    throw new Error(error.message);
  }

  return data as ClientOnboarding;
}

export async function fetchTalentOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<TalentOnboarding | null> {
  const { data } = await supabase
    .from("talent_onboarding")
    .select(TALENT_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  return (data as TalentOnboarding | null) ?? null;
}

export async function getOrCreateTalentOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<TalentOnboarding> {
  const existing = await fetchTalentOnboarding(supabase, userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("talent_onboarding")
    .insert({ id: userId })
    .select(TALENT_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      const existingAfterRace = await fetchTalentOnboarding(supabase, userId);
      if (existingAfterRace) {
        return existingAfterRace;
      }
    }
    throw new Error(error.message);
  }

  return data as TalentOnboarding;
}
