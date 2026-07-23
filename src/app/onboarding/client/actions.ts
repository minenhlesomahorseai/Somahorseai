"use server";

import { redirect } from "next/navigation";

import { getDashboardPath } from "@/lib/auth/redirect";
import { sendClientOnboardingReceived } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export interface ClientStepInput {
  current_step: number;
  company_name?: string | null;
  sector?: string | null;
  project_type?: string | null;
  problem?: string | null;
  timeline?: string | null;
  budget_range?: string | null;
}

async function persist(input: ClientStepInput, submitted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("client_onboarding")
    .update({ ...input, submitted })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return { supabase, user };
}

export async function saveClientProgress(input: ClientStepInput) {
  await persist(input, false);
}

export async function submitClientOnboarding(input: ClientStepInput) {
  const { supabase, user } = await persist(input, true);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const fullName = (profile?.full_name as string | null) ?? null;
  await sendClientOnboardingReceived({
    to: (profile?.email as string | null) ?? user.email ?? null,
    firstName: fullName?.trim().split(/\s+/)[0] ?? null,
    userId: user.id,
  });
  redirect(getDashboardPath("client"));
}
