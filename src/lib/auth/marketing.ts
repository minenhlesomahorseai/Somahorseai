import { buildInitials } from "@/components/dashboard/dashboard-user";
import { createClient } from "@/lib/supabase/server";

import { fetchProfile } from "./profile";
import { getDashboardPath } from "./redirect";
import type { OnboardingStatus, UserRole } from "./types";

export interface MarketingUser {
  role: UserRole;
  fullName: string | null;
  firstName: string | null;
  initials: string;
  dashboardPath: string;
  /** Where the primary CTA should lead. Clients get the project intake. */
  startProjectPath: string | null;
  onboardingStatus: OnboardingStatus;
}

/**
 * Resolves the signed-in user for the public marketing site so the navbar and
 * page CTAs can adapt to who's viewing. Returns null for anonymous visitors —
 * never redirects, so it's safe to call from any marketing route.
 */
export async function getMarketingUser(): Promise<MarketingUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchProfile(supabase, user.id);
  if (!profile) return null;

  const fullName = profile.full_name;
  return {
    role: profile.role,
    fullName,
    firstName: fullName ? fullName.trim().split(/\s+/)[0] : null,
    initials: buildInitials(fullName, profile.email ?? user.email ?? null),
    dashboardPath: getDashboardPath(profile.role),
    startProjectPath:
      profile.role === "client" ? "/dashboard/client/new-project" : null,
    onboardingStatus: profile.onboarding_status,
  };
}
