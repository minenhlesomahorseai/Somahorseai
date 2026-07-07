import { redirect } from "next/navigation";

import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { fetchProfile } from "@/lib/auth/profile";
import { ensureWelcomeEmail } from "@/lib/email/welcome";
import { getOrCreateTalentOnboarding } from "@/lib/onboarding/data";
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

  if (profile.onboarding_status === "complete" && onboarding.stage === "approved") {
    redirect(getPostAuthRedirect(profile.role, profile.onboarding_status));
  }

  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : null;

  await ensureWelcomeEmail({
    supabase,
    table: "talent_onboarding",
    userId: user.id,
    role: "talent",
    email: profile.email ?? user.email ?? null,
    firstName,
    alreadySent: onboarding.welcome_email_sent,
  });

  return <TalentOnboarding initial={onboarding} firstName={firstName} />;
}
