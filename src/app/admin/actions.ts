"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/auth/admin";
import type { TalentStage } from "@/lib/auth/types";
import {
  sendAssessmentInvite,
  sendTalentPassed,
  sendTalentRejected,
} from "@/lib/email";
import {
  createAssessmentForTalent,
  timeLimitMinutes,
} from "@/lib/assessment/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TRANSITIONS: Record<string, TalentStage[]> = {
  pending_review: ["assessment", "rejected"],
  assessment_review: ["interview", "rejected"],
  interview_review: ["approved", "rejected"],
};

interface TalentContact {
  email: string | null;
  firstName: string | null;
  fullName: string | null;
}

export async function setTalentStage(
  talentId: string,
  fromStage: TalentStage,
  nextStage: TalentStage,
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdminUser(supabase, user))) {
    throw new Error("Not authorized");
  }

  const allowed = ALLOWED_TRANSITIONS[fromStage];
  if (!allowed || !allowed.includes(nextStage)) {
    throw new Error(`Cannot move ${fromStage} -> ${nextStage}`);
  }

  const contact = await fetchTalentContact(supabase, talentId);

  // Approving to assessment: generate the AI assessment FIRST so we never
  // advance the stage (and email a dead link) when generation fails.
  let assessmentToken: string | null = null;
  let assessmentMinutes = 0;
  if (nextStage === "assessment") {
    const { data: talentRow, error: talentErr } = await supabase
      .from("talent_onboarding")
      .select(
        "headline, primary_role, years_experience, skills, bio, agri_experience, portfolio_url, github_url"
      )
      .eq("id", talentId)
      .single();
    if (talentErr || !talentRow) {
      throw new Error("Could not load candidate profile for assessment");
    }

    try {
      const assessment = await createAssessmentForTalent({
        writeClient: createAdminClient() ?? supabase,
        talentId,
        talent: talentRow,
        fullName: contact.fullName,
      });
      assessmentToken = assessment.token;
      assessmentMinutes = timeLimitMinutes(assessment);
    } catch (e) {
      const detail = e instanceof Error ? e.message : "unknown error";
      throw new Error(`Could not generate assessment: ${detail}`);
    }
  }

  const { error } = await supabase
    .from("talent_onboarding")
    .update({
      stage: nextStage,
      admin_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", talentId);

  if (error) {
    throw new Error(error.message);
  }

  // Fire the appropriate transactional email (best-effort, never throws).
  if (nextStage === "assessment" && assessmentToken) {
    await sendAssessmentInvite({
      to: contact.email,
      firstName: contact.firstName,
      assessmentToken,
      timeLimitMinutes: assessmentMinutes,
    });
  } else if (nextStage === "interview") {
    await sendTalentPassed({
      to: contact.email,
      firstName: contact.firstName,
      notes,
    });
  } else if (nextStage === "rejected") {
    await sendTalentRejected({
      to: contact.email,
      firstName: contact.firstName,
      reason: notes,
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/assessment/${talentId}`);
}

async function fetchTalentContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  talentId: string
): Promise<TalentContact> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", talentId)
    .maybeSingle();
  const fullName = (data?.full_name as string | null) ?? null;
  return {
    email: (data?.email as string | null) ?? null,
    firstName: fullName ? fullName.trim().split(/\s+/)[0] : null,
    fullName,
  };
}
