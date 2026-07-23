import { timeLimitMinutes } from "@/lib/assessment/data";
import type {
  AssessmentRecord,
  ClientOnboarding,
  InterviewSchedulingData,
  Profile,
  TalentOnboarding,
} from "@/lib/auth/types";
import {
  reconcileConfirmedInterviewEmails,
} from "@/lib/interviews/service";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  sendAssessmentInvite,
  sendAssessmentReceived,
  sendClientOnboardingReceived,
  sendTalentApplicationReceived,
  sendTalentApproved,
  sendTalentPassed,
  sendTalentRejected,
} from ".";

interface Contact {
  userId: string;
  email: string | null;
  firstName: string | null;
}

function contact(
  profile: Profile,
  fallbackEmail: string | null | undefined
): Contact {
  return {
    userId: profile.id,
    email: profile.email ?? fallbackEmail ?? null,
    firstName: profile.full_name?.trim().split(/\s+/)[0] ?? null,
  };
}

/**
 * Repairs the one lifecycle message that represents the applicant's current
 * stage. All send helpers use stable dedupe keys, so this is safe on every page
 * load and never sends a message that was already recorded as sent.
 */
export async function reconcileTalentLifecycleEmail(opts: {
  profile: Profile;
  onboarding: TalentOnboarding;
  userEmail?: string | null;
  assessment: AssessmentRecord | null;
  interview: InterviewSchedulingData;
}): Promise<void> {
  const person = contact(opts.profile, opts.userEmail);
  const stage = opts.onboarding.stage;

  if (stage === "profile") return;

  if (stage === "pending_review") {
    await sendTalentApplicationReceived({
      to: person.email,
      firstName: person.firstName,
      userId: person.userId,
    });
    return;
  }

  if (stage === "assessment" && opts.assessment) {
    await sendAssessmentInvite({
      to: person.email,
      firstName: person.firstName,
      talentId: person.userId,
      assessmentToken: opts.assessment.token,
      timeLimitMinutes: timeLimitMinutes(opts.assessment),
    });
    return;
  }

  if (stage === "assessment_review" && opts.assessment) {
    await sendAssessmentReceived({
      to: person.email,
      firstName: person.firstName,
      talentId: person.userId,
      assessmentId: opts.assessment.id,
    });
    return;
  }

  if (stage === "interview" && opts.interview.schedule) {
    await sendTalentPassed({
      to: person.email,
      firstName: person.firstName,
      talentId: person.userId,
      scheduleId: opts.interview.schedule.id,
    });
    return;
  }

  if (stage === "interview_review") {
    const writer = createAdminClient();
    if (writer) {
      const reconciled = await reconcileConfirmedInterviewEmails(
        writer,
        person.userId
      );
      if (reconciled) return;
    }
    if (opts.interview.schedule) {
      await sendTalentPassed({
        to: person.email,
        firstName: person.firstName,
        talentId: person.userId,
        scheduleId: opts.interview.schedule.id,
      });
    }
    return;
  }

  if (stage === "approved") {
    await sendTalentApproved({
      to: person.email,
      firstName: person.firstName,
      talentId: person.userId,
    });
    return;
  }

  if (stage === "rejected") {
    const fromStage = opts.interview.schedule
      ? "interview_review"
      : opts.assessment
        ? "assessment_review"
        : "pending_review";
    await sendTalentRejected({
      to: person.email,
      firstName: person.firstName,
      talentId: person.userId,
      fromStage,
      reason: opts.onboarding.admin_notes,
    });
  }
}

export async function reconcileClientLifecycleEmail(opts: {
  profile: Profile;
  onboarding: ClientOnboarding;
  userEmail?: string | null;
}): Promise<void> {
  if (!opts.onboarding.submitted) return;
  const person = contact(opts.profile, opts.userEmail);
  await sendClientOnboardingReceived({
    to: person.email,
    firstName: person.firstName,
    userId: person.userId,
  });
}
