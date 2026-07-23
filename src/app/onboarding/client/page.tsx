import { redirect } from "next/navigation";

import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { fetchProfile } from "@/lib/auth/profile";
import { reconcileClientLifecycleEmail } from "@/lib/email/reconcile";
import { ensureWelcomeEmail } from "@/lib/email/welcome";
import { getOrCreateClientOnboarding } from "@/lib/onboarding/data";
import { createClient } from "@/lib/supabase/server";

import { ClientOnboarding } from "./client-onboarding";

export default async function ClientOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(supabase, user.id);

  if (!profile || profile.role !== "client") {
    redirect(profile ? getPostAuthRedirect(profile.role, profile.onboarding_status) : "/login");
  }

  const onboarding = await getOrCreateClientOnboarding(supabase, user.id);
  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : null;

  await ensureWelcomeEmail({
    supabase,
    table: "client_onboarding",
    userId: user.id,
    role: "client",
    email: profile.email ?? user.email ?? null,
    firstName,
    alreadySent: onboarding.welcome_email_sent,
  });

  await reconcileClientLifecycleEmail({
    profile,
    onboarding,
    userEmail: user.email,
  });

  if (profile.onboarding_status === "complete") {
    redirect(getPostAuthRedirect(profile.role, profile.onboarding_status));
  }

  return <ClientOnboarding initial={onboarding} firstName={firstName} />;
}
