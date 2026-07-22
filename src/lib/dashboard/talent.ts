import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildInitials, type DashboardUser } from "@/components/dashboard/dashboard-user";
import { fetchProfile } from "@/lib/auth/profile";
import type { TalentOnboarding } from "@/lib/auth/types";
import { fetchTalentOnboarding } from "@/lib/onboarding/data";
import { createClient } from "@/lib/supabase/server";

export interface TalentSession {
  userId: string;
  user: DashboardUser;
  talent: TalentOnboarding;
}

export interface TalentProject {
  project_id: string;
  title: string;
  summary: string | null;
  project_status: string;
  solution_type: string | null;
  timeline_weeks: number | null;
  started_at: string | null;
  assignment_role: string;
  assignment_status: string;
}

export interface TalentInvitation {
  id: string;
  project_id: string;
  role: string;
  match_score: number;
  reason: string | null;
  status: string;
  nominated_at: string;
  projects:
    | {
        id: string;
        title: string;
        summary: string | null;
        status: string;
        solution_type: string | null;
        timeline_weeks: number | null;
      }
    | Array<{
        id: string;
        title: string;
        summary: string | null;
        status: string;
        solution_type: string | null;
        timeline_weeks: number | null;
      }>
    | null;
}

export interface TalentNotification {
  id: string;
  project_id: string | null;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

function getFirstName(fullName: string | null): string | null {
  return fullName?.trim().split(/\s+/)[0] ?? null;
}

/** Request-memoized so the talent layout and page can safely share it. */
export const loadTalentSession = cache(async (): Promise<TalentSession> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await fetchProfile(supabase, user.id);
  if (!profile || profile.role !== "talent") redirect("/onboarding/talent");

  const talent = await fetchTalentOnboarding(supabase, user.id);
  if (!talent) redirect("/onboarding/talent");

  const email = profile.email ?? user.email ?? null;
  return {
    userId: user.id,
    user: {
      fullName: profile.full_name,
      firstName: getFirstName(profile.full_name),
      company: null,
      email,
      initials: buildInitials(profile.full_name, email),
    },
    talent,
  };
});

export async function fetchTalentProjects(supabase: SupabaseClient): Promise<TalentProject[]> {
  const { data } = await supabase.rpc("list_my_talent_projects");
  return (data ?? []) as TalentProject[];
}

export async function fetchTalentInvitations(
  supabase: SupabaseClient,
  talentId: string
): Promise<TalentInvitation[]> {
  const { data } = await supabase
    .from("project_assignments")
    .select(
      "id, project_id, role, match_score, reason, status, nominated_at, projects(id, title, summary, status, solution_type, timeline_weeks)"
    )
    .eq("talent_id", talentId)
    .eq("status", "proposed")
    .order("nominated_at", { ascending: false });

  return (data ?? []) as unknown as TalentInvitation[];
}

export function getInvitationProject(invitation: TalentInvitation) {
  return Array.isArray(invitation.projects) ? invitation.projects[0] ?? null : invitation.projects;
}

export function talentProfileCompletion(talent: TalentOnboarding): number {
  return [
    talent.primary_role,
    talent.years_experience,
    talent.skills.length > 0,
    talent.headline,
    talent.bio,
    talent.country,
    talent.portfolio_url || talent.github_url,
  ].filter(Boolean).length;
}
