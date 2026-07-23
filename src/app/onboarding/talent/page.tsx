import { redirect } from "next/navigation";

import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { fetchProfile } from "@/lib/auth/profile";
import { fetchLatestAssessmentForTalent } from "@/lib/assessment/data";
import { reconcileTalentLifecycleEmail } from "@/lib/email/reconcile";
import { ensureWelcomeEmail } from "@/lib/email/welcome";
import { googleCalendarUrl } from "@/lib/interviews/calendar";
import {
  confirmedInterviewProposal,
  fetchInterviewScheduling,
} from "@/lib/interviews/data";
import { getOrCreateTalentOnboarding } from "@/lib/onboarding/data";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

import { TalentOnboarding } from "./talent-onboarding";

export default async function TalentOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(supabase, user.id);

  if (!profile || profile.role !== "talent") {
    redirect(profile ? getPostAuthRedirect(profile.role, profile.onboarding_status) : "/login");
  }

  const onboarding = await getOrCreateTalentOnboarding(supabase, user.id);
  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : null;

  const [assessment, interview] = await Promise.all([
    fetchLatestAssessmentForTalent(supabase, user.id),
    fetchInterviewScheduling(supabase, user.id),
  ]);
  const confirmed = confirmedInterviewProposal(interview);
  const calendarUrl =
    confirmed && interview.schedule
      ? googleCalendarUrl({
          startsAt: confirmed.starts_at,
          endsAt: confirmed.ends_at,
          talentName: profile.full_name,
          dashboardUrl: siteUrl("/onboarding/talent"),
          meetingUrl: interview.schedule.meeting_url,
        })
      : null;

  await ensureWelcomeEmail({
    supabase,
    table: "talent_onboarding",
    userId: user.id,
    role: "talent",
    email: profile.email ?? user.email ?? null,
    firstName,
    alreadySent: onboarding.welcome_email_sent,
  });

  await reconcileTalentLifecycleEmail({
    profile,
    onboarding,
    userEmail: user.email,
    assessment,
    interview,
  });

  if (profile.onboarding_status === "complete" && onboarding.stage === "approved") {
    redirect(getPostAuthRedirect(profile.role, profile.onboarding_status));
  }

  return (
    <TalentOnboarding
      initial={onboarding}
      firstName={firstName}
      assessmentToken={assessment?.token ?? null}
      interview={interview}
      googleCalendarUrl={calendarUrl}
    />
  );
}
