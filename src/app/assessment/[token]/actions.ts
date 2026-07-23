"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { gradeAssessment, type CandidateProfile } from "@/lib/ai/assessment";
import type { AssessmentAnswers, AssessmentRecord } from "@/lib/auth/types";
import { fetchAssessmentByToken } from "@/lib/assessment/data";
import { sendAssessmentReceived } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the signed-in user owns the assessment behind `token`, returning the
 * record plus the user id and a service-role write client. Writes to
 * talent_assessments are admin/service-role only (RLS), which keeps the AI
 * score un-spoofable by the candidate.
 */
async function authedOwnedAssessment(token: string): Promise<{
  userId: string;
  assessment: AssessmentRecord;
  authed: SupabaseClient;
  writer: SupabaseClient;
}> {
  const authed = await createClient();
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const assessment = await fetchAssessmentByToken(authed, token);
  if (!assessment || assessment.talent_id !== user.id) {
    throw new Error("Assessment not found");
  }

  const writer = createAdminClient();
  if (!writer) {
    throw new Error(
      "Assessment storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return { userId: user.id, assessment, authed, writer };
}

export async function startAssessment(token: string): Promise<void> {
  const { assessment, writer } = await authedOwnedAssessment(token);
  if (assessment.status !== "ready") return;

  const { error } = await writer
    .from("talent_assessments")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", assessment.id);
  if (error) throw new Error(error.message);
}

export interface SubmitInput {
  token: string;
  answers: AssessmentAnswers;
  pasteFlags: number;
  tabViolations: number;
}

export async function submitAssessment(
  input: SubmitInput
): Promise<{ status: "graded" | "submitted" }> {
  const { userId, assessment, authed, writer } = await authedOwnedAssessment(
    input.token
  );

  if (assessment.status === "graded" || assessment.status === "disqualified") {
    return { status: "submitted" };
  }

  const submittedAt = new Date().toISOString();
  const { error: submitErr } = await writer
    .from("talent_assessments")
    .update({
      answers: input.answers,
      paste_flags: Math.max(0, Math.trunc(input.pasteFlags) || 0),
      tab_violations: Math.max(0, Math.trunc(input.tabViolations) || 0),
      status: "submitted",
      submitted_at: submittedAt,
    })
    .eq("id", assessment.id);
  if (submitErr) throw new Error(submitErr.message);

  // Grade with Gemini. Best-effort: if grading fails the admin still sees the
  // raw answers and can grade/decide manually.
  let graded = false;
  try {
    const profile = await loadCandidateProfile(authed, userId);
    const result = await gradeAssessment(
      profile,
      assessment.questions,
      input.answers
    );
    const { error: gradeErr } = await writer
      .from("talent_assessments")
      .update({
        status: "graded",
        score: result.score,
        max_score: result.maxScore,
        evaluation: result.evaluation,
        overall_feedback: result.overallFeedback,
        recommendation: result.recommendation,
        graded_at: new Date().toISOString(),
      })
      .eq("id", assessment.id);
    if (!gradeErr) graded = true;
  } catch (e) {
    console.error("[assessment] grading failed:", e);
  }

  // Move the applicant into admin review (allowed self-transition).
  const { error: stageError } = await authed
    .from("talent_onboarding")
    .update({ stage: "assessment_review" })
    .eq("id", userId)
    .eq("stage", "assessment");
  if (stageError) throw new Error(stageError.message);

  await sendAssessmentReceipt(authed, {
    talentId: userId,
    assessmentId: assessment.id,
  });

  return { status: graded ? "graded" : "submitted" };
}

export async function disqualifyAssessment(input: {
  token: string;
  reason: string;
  tabViolations: number;
}): Promise<void> {
  const { userId, assessment, authed, writer } = await authedOwnedAssessment(
    input.token
  );
  if (assessment.status === "graded" || assessment.status === "disqualified") {
    return;
  }

  const { error } = await writer
    .from("talent_assessments")
    .update({
      status: "disqualified",
      disqualified_reason: input.reason,
      tab_violations: Math.max(0, Math.trunc(input.tabViolations) || 0),
      submitted_at: new Date().toISOString(),
    })
    .eq("id", assessment.id);
  if (error) throw new Error(error.message);

  const { error: stageError } = await authed
    .from("talent_onboarding")
    .update({ stage: "assessment_review" })
    .eq("id", userId)
    .eq("stage", "assessment");
  if (stageError) throw new Error(stageError.message);

  await sendAssessmentReceipt(authed, {
    talentId: userId,
    assessmentId: assessment.id,
  });
}

async function sendAssessmentReceipt(
  supabase: SupabaseClient,
  opts: { talentId: string; assessmentId: string }
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", opts.talentId)
    .maybeSingle();
  const fullName = (profile?.full_name as string | null) ?? null;
  await sendAssessmentReceived({
    to: (profile?.email as string | null) ?? null,
    firstName: fullName?.trim().split(/\s+/)[0] ?? null,
    talentId: opts.talentId,
    assessmentId: opts.assessmentId,
  });
}

async function loadCandidateProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<CandidateProfile> {
  const { data: row } = await supabase
    .from("talent_onboarding")
    .select(
      "headline, primary_role, years_experience, skills, bio, agri_experience, portfolio_url, github_url"
    )
    .eq("id", userId)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    fullName: (profile?.full_name as string | null) ?? null,
    headline: row?.headline ?? null,
    primaryRole: row?.primary_role ?? null,
    yearsExperience: row?.years_experience ?? null,
    skills: (row?.skills as string[] | null) ?? [],
    bio: row?.bio ?? null,
    agriExperience: row?.agri_experience ?? null,
    portfolioUrl: row?.portfolio_url ?? null,
    githubUrl: row?.github_url ?? null,
  };
}
