import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  InterviewProposal,
  InterviewSchedule,
} from "@/lib/auth/types";
import {
  sendInterviewConfirmed,
  sendInterviewProposal,
  sendInterviewProposalDeclined,
} from "@/lib/email";
import { siteUrl } from "@/lib/site";

import { googleCalendarUrl, interviewIcs } from "./calendar";
import {
  INTERVIEW_PROPOSAL_COLUMNS,
  INTERVIEW_SCHEDULE_COLUMNS,
} from "./data";

interface Contact {
  id: string | null;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
}

interface ProposalInput {
  writer: SupabaseClient;
  talentId: string;
  proposedBy: string;
  proposerRole: "admin" | "talent";
  startsAt: string;
  note?: string | null;
  meetingUrl?: string | null;
}

interface RespondInput {
  writer: SupabaseClient;
  talentId: string;
  proposalId: string;
  responderRole: "admin" | "talent";
  accept: boolean;
  meetingUrl?: string | null;
}

export function formatInterviewTime(
  startsAt: string,
  endsAt: string,
  timeZone = "Africa/Johannesburg"
): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = new Intl.DateTimeFormat("en-ZA", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-ZA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(start);
  const endTime = new Intl.DateTimeFormat("en-ZA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(end);
  return `${date}, ${startTime}–${endTime} (${timeZone})`;
}

export function validateInterviewStart(startsAt: string): {
  start: Date;
  end: Date;
} {
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime())) {
    throw new Error("Choose a valid interview date and time.");
  }
  const now = Date.now();
  const latest = now + 7 * 24 * 60 * 60_000;
  if (start.getTime() < now + 5 * 60_000 || start.getTime() > latest) {
    throw new Error("Choose a time between 5 minutes and 7 days from now.");
  }
  return { start, end: new Date(start.getTime() + 45 * 60_000) };
}

export function validateMeetingUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Meeting link must use http or https.");
    }
    return url.toString();
  } catch {
    throw new Error("Enter a valid meeting link.");
  }
}

export async function createInterviewProposal(
  input: ProposalInput
): Promise<InterviewProposal> {
  const { start, end } = validateInterviewStart(input.startsAt);
  const meetingUrl = validateMeetingUrl(input.meetingUrl);
  const note = input.note?.trim().slice(0, 500) || null;

  const { data: onboarding, error: onboardingError } = await input.writer
    .from("talent_onboarding")
    .select("stage")
    .eq("id", input.talentId)
    .single();
  if (onboardingError || !onboarding) {
    throw new Error("Talent application not found.");
  }
  if (onboarding.stage !== "interview") {
    throw new Error("Interview scheduling is not open for this application.");
  }

  const { data: proposalId, error } = await input.writer.rpc(
    "create_interview_proposal",
    {
      p_talent_id: input.talentId,
      p_proposed_by: input.proposedBy,
      p_proposer_role: input.proposerRole,
      p_starts_at: start.toISOString(),
      p_ends_at: end.toISOString(),
      p_note: note,
      p_meeting_url: meetingUrl,
    }
  );
  if (error || !proposalId) {
    throw new Error(error?.message ?? "Could not propose the interview time.");
  }

  const { data: proposal, error: proposalError } = await input.writer
    .from("interview_proposals")
    .select(INTERVIEW_PROPOSAL_COLUMNS)
    .eq("id", proposalId)
    .single();
  if (proposalError || !proposal) {
    throw new Error(
      proposalError?.message ?? "The proposed time could not be loaded."
    );
  }

  await notifyNewProposal(input.writer, {
    talentId: input.talentId,
    proposal: proposal as InterviewProposal,
    proposerRole: input.proposerRole,
    note,
  });
  return proposal as InterviewProposal;
}

export async function respondToInterviewProposal(
  input: RespondInput
): Promise<{ proposal: InterviewProposal; schedule: InterviewSchedule }> {
  const meetingUrl = validateMeetingUrl(input.meetingUrl);
  const { data: proposal, error: proposalError } = await input.writer
    .from("interview_proposals")
    .select(INTERVIEW_PROPOSAL_COLUMNS)
    .eq("id", input.proposalId)
    .single();
  if (proposalError || !proposal || proposal.status !== "pending") {
    throw new Error("This interview proposal is no longer pending.");
  }
  if (proposal.proposer_role === input.responderRole) {
    throw new Error("The other participant must respond to this proposal.");
  }

  const { error } = await input.writer.rpc("respond_to_interview_proposal", {
    p_talent_id: input.talentId,
    p_proposal_id: input.proposalId,
    p_accept: input.accept,
    p_meeting_url: meetingUrl,
  });
  if (error) throw new Error(error.message);

  const [{ data: updatedProposal }, { data: schedule }] = await Promise.all([
    input.writer
      .from("interview_proposals")
      .select(INTERVIEW_PROPOSAL_COLUMNS)
      .eq("id", input.proposalId)
      .single(),
    input.writer
      .from("interview_schedules")
      .select(INTERVIEW_SCHEDULE_COLUMNS)
      .eq("talent_id", input.talentId)
      .single(),
  ]);
  if (!updatedProposal || !schedule) {
    throw new Error("The interview response was saved but could not be reloaded.");
  }

  if (input.accept) {
    await notifyInterviewConfirmed(input.writer, {
      talentId: input.talentId,
      proposal: updatedProposal as InterviewProposal,
      schedule: schedule as InterviewSchedule,
    });
  } else {
    await notifyProposalDeclined(input.writer, {
      talentId: input.talentId,
      proposal: updatedProposal as InterviewProposal,
    });
  }

  return {
    proposal: updatedProposal as InterviewProposal,
    schedule: schedule as InterviewSchedule,
  };
}

export async function reconcileConfirmedInterviewEmails(
  writer: SupabaseClient,
  talentId: string
): Promise<boolean> {
  const { data: schedule } = await writer
    .from("interview_schedules")
    .select(INTERVIEW_SCHEDULE_COLUMNS)
    .eq("talent_id", talentId)
    .maybeSingle();
  if (
    !schedule ||
    schedule.status !== "confirmed" ||
    !schedule.confirmed_proposal_id
  ) {
    return false;
  }
  const { data: proposal } = await writer
    .from("interview_proposals")
    .select(INTERVIEW_PROPOSAL_COLUMNS)
    .eq("id", schedule.confirmed_proposal_id)
    .maybeSingle();
  if (!proposal) return false;

  await notifyInterviewConfirmed(writer, {
    talentId,
    proposal: proposal as InterviewProposal,
    schedule: schedule as InterviewSchedule,
  });
  return true;
}

async function talentContact(
  writer: SupabaseClient,
  talentId: string
): Promise<Contact> {
  const { data } = await writer
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", talentId)
    .maybeSingle();
  const fullName = (data?.full_name as string | null) ?? null;
  return {
    id: talentId,
    email: (data?.email as string | null) ?? null,
    fullName,
    firstName: fullName?.trim().split(/\s+/)[0] ?? null,
  };
}

async function adminContacts(writer: SupabaseClient): Promise<Contact[]> {
  const { data: rows } = await writer.from("admins").select("email");
  const emails = (rows ?? [])
    .map((row) => String(row.email || "").trim().toLowerCase())
    .filter(Boolean);
  if (!emails.length) return [];

  const { data: profiles } = await writer
    .from("profiles")
    .select("id, full_name, email")
    .in("email", emails);
  const byEmail = new Map(
    (profiles ?? []).map((profile) => [
      String(profile.email || "").toLowerCase(),
      profile,
    ])
  );
  return emails.map((email) => {
    const profile = byEmail.get(email);
    const fullName = (profile?.full_name as string | null) ?? null;
    return {
      id: (profile?.id as string | null) ?? null,
      email,
      fullName,
      firstName: fullName?.trim().split(/\s+/)[0] ?? null,
    };
  });
}

async function proposerContact(
  writer: SupabaseClient,
  proposal: InterviewProposal,
  talent: Contact,
  admins: Contact[]
): Promise<Contact> {
  if (proposal.proposer_role === "talent") return talent;
  const known = admins.find((admin) => admin.id === proposal.proposed_by);
  if (known) return known;
  const { data } = await writer
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", proposal.proposed_by)
    .maybeSingle();
  const fullName = (data?.full_name as string | null) ?? null;
  return {
    id: proposal.proposed_by,
    email: (data?.email as string | null) ?? null,
    fullName,
    firstName: fullName?.trim().split(/\s+/)[0] ?? "Somahorse.ai admin",
  };
}

async function notifyNewProposal(
  writer: SupabaseClient,
  opts: {
    talentId: string;
    proposal: InterviewProposal;
    proposerRole: "admin" | "talent";
    note: string | null;
  }
): Promise<void> {
  const [talent, admins] = await Promise.all([
    talentContact(writer, opts.talentId),
    adminContacts(writer),
  ]);
  const proposer = await proposerContact(writer, opts.proposal, talent, admins);
  const when = formatInterviewTime(
    opts.proposal.starts_at,
    opts.proposal.ends_at
  );
  const recipients = opts.proposerRole === "talent" ? admins : [talent];
  await Promise.all(
    recipients.map((recipient) =>
      sendInterviewProposal({
        to: recipient.email,
        recipientName: recipient.firstName,
        recipientUserId: recipient.id,
        proposalId: opts.proposal.id,
        proposerName:
          proposer.fullName ??
          (opts.proposerRole === "admin"
            ? "The Somahorse.ai team"
            : "The candidate"),
        when,
        schedulingPath:
          opts.proposerRole === "talent"
            ? `/admin/interviews/${opts.talentId}`
            : "/onboarding/talent",
        note: opts.note,
      })
    )
  );
}

async function notifyProposalDeclined(
  writer: SupabaseClient,
  opts: { talentId: string; proposal: InterviewProposal }
): Promise<void> {
  const [talent, admins] = await Promise.all([
    talentContact(writer, opts.talentId),
    adminContacts(writer),
  ]);
  const proposer = await proposerContact(writer, opts.proposal, talent, admins);
  await sendInterviewProposalDeclined({
    to: proposer.email,
    recipientName: proposer.firstName,
    recipientUserId: proposer.id,
    proposalId: opts.proposal.id,
    when: formatInterviewTime(
      opts.proposal.starts_at,
      opts.proposal.ends_at
    ),
    schedulingPath:
      opts.proposal.proposer_role === "admin"
        ? `/admin/interviews/${opts.talentId}`
        : "/onboarding/talent",
  });
}

async function notifyInterviewConfirmed(
  writer: SupabaseClient,
  opts: {
    talentId: string;
    proposal: InterviewProposal;
    schedule: InterviewSchedule;
  }
): Promise<void> {
  const [talent, admins] = await Promise.all([
    talentContact(writer, opts.talentId),
    adminContacts(writer),
  ]);
  const when = formatInterviewTime(
    opts.proposal.starts_at,
    opts.proposal.ends_at,
    opts.schedule.timezone
  );
  const adminDashboardUrl = siteUrl(`/admin/interviews/${opts.talentId}`);
  const calendarUrl = googleCalendarUrl({
    startsAt: opts.proposal.starts_at,
    endsAt: opts.proposal.ends_at,
    talentName: talent.fullName,
    dashboardUrl: adminDashboardUrl,
    meetingUrl: opts.schedule.meeting_url,
  });
  const ics = interviewIcs({
    uid: opts.proposal.id,
    startsAt: opts.proposal.starts_at,
    endsAt: opts.proposal.ends_at,
    talentName: talent.fullName,
    dashboardUrl: adminDashboardUrl,
    meetingUrl: opts.schedule.meeting_url,
  });

  await Promise.all([
    sendInterviewConfirmed({
      to: talent.email,
      recipientName: talent.firstName,
      recipientUserId: talent.id,
      proposalId: opts.proposal.id,
      talentName: talent.fullName,
      when,
      schedulingPath: "/onboarding/talent",
      googleCalendarUrl: calendarUrl,
      meetingUrl: opts.schedule.meeting_url,
      ics,
    }),
    ...admins.map((admin) =>
      sendInterviewConfirmed({
        to: admin.email,
        recipientName: admin.firstName,
        recipientUserId: admin.id,
        proposalId: opts.proposal.id,
        talentName: talent.fullName,
        when,
        schedulingPath: `/admin/interviews/${opts.talentId}`,
        googleCalendarUrl: calendarUrl,
        meetingUrl: opts.schedule.meeting_url,
        ics,
      })
    ),
  ]);
}
