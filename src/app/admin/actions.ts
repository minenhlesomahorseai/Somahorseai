"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  const adminClient = createAdminClient() ?? supabase;
  const contact = await fetchTalentContact(adminClient, talentId);

  // Approving to assessment: generate the AI assessment FIRST so we never
  // advance the stage (and email a dead link) when generation fails.
  let assessmentToken: string | null = null;
  let assessmentMinutes = 0;
  if (nextStage === "assessment") {
    const { data: talentRow, error: talentErr } = await adminClient
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
        writeClient: adminClient,
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

  const { error } = await adminClient
    .from("talent_onboarding")
    .update({
      stage: nextStage,
      admin_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", talentId)
    .eq("stage", fromStage);

  if (error) {
    throw new Error(error.message);
  }

  // Fire the appropriate transactional email (best-effort, never throws).
  if (nextStage === "assessment" && assessmentToken) {
    const res = await sendAssessmentInvite({
      to: contact.email,
      firstName: contact.firstName,
      assessmentToken,
      timeLimitMinutes: assessmentMinutes,
    });
    console.log(`[admin action] sendAssessmentInvite result for ${contact.email}:`, res);
  } else if (nextStage === "interview") {
    const res = await sendTalentPassed({
      to: contact.email,
      firstName: contact.firstName,
      notes,
    });
    console.log(`[admin action] sendTalentPassed result for ${contact.email}:`, res);
  } else if (nextStage === "rejected") {
    const res = await sendTalentRejected({
      to: contact.email,
      firstName: contact.firstName,
      reason: notes,
    });
    console.log(`[admin action] sendTalentRejected result for ${contact.email}:`, res);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/assessment/${talentId}`);
}

async function fetchTalentContact(
  supabase: SupabaseClient,
  talentId: string
): Promise<TalentContact> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", talentId)
    .maybeSingle();

  let email = (data?.email as string | null) ?? null;
  const fullName = (data?.full_name as string | null) ?? null;

  // Fallback to Auth Admin API if email is missing from profiles
  if (!email) {
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(talentId);
        if (authUser?.user?.email) {
          email = authUser.user.email;
        }
      } catch (e) {
        console.error(`[admin action] Failed to fetch user from auth admin API for ${talentId}:`, e);
      }
    }
  }

  return {
    email,
    firstName: fullName ? fullName.trim().split(/\s+/)[0] : null,
    fullName,
  };
}
