"use server";

import type { TalentAssessment } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export interface TalentProfileInput {
  current_step: number;
  headline?: string | null;
  primary_role?: string | null;
  years_experience?: number | null;
  skills?: string[];
  bio?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  country?: string | null;
  agri_experience?: string | null;
}

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return { supabase, userId: user.id };
}

export async function saveTalentProgress(input: TalentProfileInput) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update(input)
    .eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function submitTalentProfile(input: TalentProfileInput) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update({ ...input, stage: "pending_review" })
    .eq("id", userId)
    .eq("stage", "profile");
  if (error) {
    throw new Error(error.message);
  }
}

export async function submitTalentAssessment(assessment: TalentAssessment) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update({ assessment, stage: "assessment_review" })
    .eq("id", userId)
    .eq("stage", "assessment");
  if (error) {
    throw new Error(error.message);
  }
}

export async function confirmTalentInterview() {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update({ stage: "interview_review" })
    .eq("id", userId)
    .eq("stage", "interview");
  if (error) {
    throw new Error(error.message);
  }
}
