"use server";

import { revalidatePath } from "next/cache";

import type { TalentAssessment } from "@/lib/auth/types";
import { sendTalentApplicationReceived } from "@/lib/email";
import {
  createInterviewProposal,
  respondToInterviewProposal,
} from "@/lib/interviews/service";
import { createAdminClient } from "@/lib/supabase/admin";
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
  return { supabase, user };
}

export async function saveTalentProgress(input: TalentProfileInput) {
  const { supabase, user } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update(input)
    .eq("id", user.id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function submitTalentProfile(input: TalentProfileInput) {
  const { supabase, user } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update({ ...input, stage: "pending_review" })
    .eq("id", user.id)
    .eq("stage", "profile");
  if (error) {
    throw new Error(error.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const fullName = (profile?.full_name as string | null) ?? null;
  await sendTalentApplicationReceived({
    to: (profile?.email as string | null) ?? user.email ?? null,
    firstName: fullName?.trim().split(/\s+/)[0] ?? null,
    userId: user.id,
  });
}

export async function submitTalentAssessment(assessment: TalentAssessment) {
  const { supabase, user } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update({ assessment, stage: "assessment_review" })
    .eq("id", user.id)
    .eq("stage", "assessment");
  if (error) {
    throw new Error(error.message);
  }
}

export async function confirmTalentInterview() {
  const { supabase, user } = await authedClient();
  const { error } = await supabase
    .from("talent_onboarding")
    .update({ stage: "interview_review" })
    .eq("id", user.id)
    .eq("stage", "interview");
  if (error) {
    throw new Error(error.message);
  }
}

export async function proposeTalentInterview(input: {
  startsAt: string;
  note?: string | null;
}): Promise<void> {
  const { user } = await authedClient();
  const writer = createAdminClient();
  if (!writer) {
    throw new Error("Interview scheduling is not configured.");
  }
  await createInterviewProposal({
    writer,
    talentId: user.id,
    proposedBy: user.id,
    proposerRole: "talent",
    startsAt: input.startsAt,
    note: input.note,
  });
  revalidatePath("/onboarding/talent");
  revalidatePath(`/admin/interviews/${user.id}`);
  revalidatePath("/admin");
}

export async function respondTalentInterview(
  proposalId: string,
  accept: boolean
): Promise<void> {
  const { user } = await authedClient();
  const writer = createAdminClient();
  if (!writer) {
    throw new Error("Interview scheduling is not configured.");
  }
  await respondToInterviewProposal({
    writer,
    talentId: user.id,
    proposalId,
    responderRole: "talent",
    accept,
  });
  revalidatePath("/onboarding/talent");
  revalidatePath(`/admin/interviews/${user.id}`);
  revalidatePath("/admin");
}
