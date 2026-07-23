"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isAdminUser } from "@/lib/auth/admin";
import type { TalentStage } from "@/lib/auth/types";
import {
  sendAssessmentInvite,
  sendTalentPassed,
  sendTalentApproved,
  sendTalentRejected,
  retryFailedEmails,
  type SendResult,
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
): Promise<{ email: SendResult | null }> {
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
  let scheduleId: string | null = null;

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

  if (nextStage === "interview") {
    const { data: schedule, error: scheduleError } = await adminClient
      .from("interview_schedules")
      .upsert(
        { talent_id: talentId, status: "awaiting_availability" },
        { onConflict: "talent_id" }
      )
      .select("id")
      .single();
    if (scheduleError || !schedule) {
      throw new Error(
        scheduleError?.message ?? "Could not create the interview workspace"
      );
    }
    scheduleId = schedule.id;
  }

  if (fromStage === "interview_review" && nextStage === "approved") {
    const { data: schedule } = await adminClient
      .from("interview_schedules")
      .select("status, confirmed_proposal_id")
      .eq("talent_id", talentId)
      .maybeSingle();
    if (
      !schedule ||
      schedule.status !== "confirmed" ||
      !schedule.confirmed_proposal_id
    ) {
      throw new Error("Confirm an interview time before approving this talent.");
    }
    const { data: confirmed } = await adminClient
      .from("interview_proposals")
      .select("starts_at")
      .eq("id", schedule.confirmed_proposal_id)
      .maybeSingle();
    if (!confirmed || new Date(confirmed.starts_at).getTime() > Date.now()) {
      throw new Error(
        "The confirmed interview has not happened yet. Approve the candidate after the interview."
      );
    }
  }

  const { data: updated, error } = await adminClient
    .from("talent_onboarding")
    .update({
      stage: nextStage,
      admin_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", talentId)
    .eq("stage", fromStage)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!updated) {
    throw new Error("This application changed before your action completed. Refresh and try again.");
  }

  let emailResult: SendResult | null = null;
  if (nextStage === "assessment" && assessmentToken) {
    emailResult = await sendAssessmentInvite({
      to: contact.email,
      firstName: contact.firstName,
      talentId,
      assessmentToken,
      timeLimitMinutes: assessmentMinutes,
    });
  } else if (nextStage === "interview" && scheduleId) {
    emailResult = await sendTalentPassed({
      to: contact.email,
      firstName: contact.firstName,
      talentId,
      scheduleId,
      notes,
    });
  } else if (nextStage === "rejected") {
    if (
      fromStage !== "pending_review" &&
      fromStage !== "assessment_review" &&
      fromStage !== "interview_review"
    ) {
      throw new Error(`Cannot reject an application from ${fromStage}`);
    }
    emailResult = await sendTalentRejected({
      to: contact.email,
      firstName: contact.firstName,
      talentId,
      fromStage,
      reason: notes,
    });
  } else if (nextStage === "approved") {
    emailResult = await sendTalentApproved({
      to: contact.email,
      firstName: contact.firstName,
      talentId,
    });
    await adminClient
      .from("interview_schedules")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("talent_id", talentId);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/assessment/${talentId}`);
  revalidatePath(`/admin/interviews/${talentId}`);
  revalidatePath("/onboarding/talent");
  return { email: emailResult };
}

export async function retryEmailDeliveries(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user))) {
    throw new Error("Not authorized");
  }
  const result = await retryFailedEmails();
  revalidatePath("/admin");
  return result;
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
