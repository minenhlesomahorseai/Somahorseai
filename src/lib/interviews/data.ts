import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  InterviewProposal,
  InterviewSchedule,
  InterviewSchedulingData,
} from "@/lib/auth/types";

export const INTERVIEW_SCHEDULE_COLUMNS =
  "id, talent_id, status, timezone, meeting_url, confirmed_proposal_id, confirmed_at, completed_at, created_at, updated_at";

export const INTERVIEW_PROPOSAL_COLUMNS =
  "id, schedule_id, proposed_by, proposer_role, starts_at, ends_at, status, note, responded_at, created_at, updated_at";

export async function fetchInterviewScheduling(
  supabase: SupabaseClient,
  talentId: string
): Promise<InterviewSchedulingData> {
  const { data: schedule } = await supabase
    .from("interview_schedules")
    .select(INTERVIEW_SCHEDULE_COLUMNS)
    .eq("talent_id", talentId)
    .maybeSingle();

  if (!schedule) {
    return { schedule: null, proposals: [] };
  }

  const { data: proposals } = await supabase
    .from("interview_proposals")
    .select(INTERVIEW_PROPOSAL_COLUMNS)
    .eq("schedule_id", schedule.id)
    .order("created_at", { ascending: false });

  return {
    schedule: schedule as InterviewSchedule,
    proposals: (proposals as InterviewProposal[] | null) ?? [],
  };
}

export function confirmedInterviewProposal(
  data: InterviewSchedulingData
): InterviewProposal | null {
  if (!data.schedule?.confirmed_proposal_id) return null;
  return (
    data.proposals.find(
      (proposal) => proposal.id === data.schedule?.confirmed_proposal_id
    ) ?? null
  );
}

