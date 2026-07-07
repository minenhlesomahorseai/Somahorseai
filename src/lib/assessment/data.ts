import { randomBytes } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AssessmentRecord } from "@/lib/auth/types";
import {
  generateAssessmentQuestions,
  type CandidateProfile,
} from "@/lib/ai/assessment";

export const ASSESSMENT_COLUMNS =
  "id, talent_id, token, status, questions, answers, time_limit_seconds, score, max_score, evaluation, overall_feedback, recommendation, paste_flags, tab_violations, disqualified_reason, started_at, submitted_at, graded_at";

export const DEFAULT_TIME_LIMIT_SECONDS = 22 * 60;

export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function timeLimitMinutes(record: { time_limit_seconds: number }): number {
  return Math.round(record.time_limit_seconds / 60);
}

export async function fetchAssessmentByToken(
  supabase: SupabaseClient,
  token: string
): Promise<AssessmentRecord | null> {
  const { data } = await supabase
    .from("talent_assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("token", token)
    .maybeSingle();
  return (data as AssessmentRecord | null) ?? null;
}

export async function fetchLatestAssessmentForTalent(
  supabase: SupabaseClient,
  talentId: string
): Promise<AssessmentRecord | null> {
  const { data } = await supabase
    .from("talent_assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as AssessmentRecord | null) ?? null;
}

interface TalentRow {
  full_name?: string | null;
  headline: string | null;
  primary_role: string | null;
  years_experience: number | null;
  skills: string[] | null;
  bio: string | null;
  agri_experience: string | null;
  portfolio_url: string | null;
  github_url: string | null;
}

function toCandidateProfile(
  row: TalentRow,
  fullName: string | null
): CandidateProfile {
  return {
    fullName,
    headline: row.headline,
    primaryRole: row.primary_role,
    yearsExperience: row.years_experience,
    skills: row.skills ?? [],
    bio: row.bio,
    agriExperience: row.agri_experience,
    portfolioUrl: row.portfolio_url,
    githubUrl: row.github_url,
  };
}

/**
 * Generates a fresh AI assessment for a talent and persists it as a new row.
 * Throws if generation fails so the caller can avoid advancing the stage.
 * `writeClient` must be able to insert (admin authed or service role).
 */
export async function createAssessmentForTalent(opts: {
  writeClient: SupabaseClient;
  talentId: string;
  talent: TalentRow;
  fullName: string | null;
}): Promise<AssessmentRecord> {
  const profile = toCandidateProfile(opts.talent, opts.fullName);
  const questions = await generateAssessmentQuestions(profile);

  const { data, error } = await opts.writeClient
    .from("talent_assessments")
    .insert({
      talent_id: opts.talentId,
      token: generateToken(),
      status: "ready",
      questions,
      time_limit_seconds: DEFAULT_TIME_LIMIT_SECONDS,
    })
    .select(ASSESSMENT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AssessmentRecord;
}
