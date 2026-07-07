import { redirect } from "next/navigation";

import { fetchProfile } from "@/lib/auth/profile";
import { fetchClientOnboarding } from "@/lib/onboarding/data";
import { createClient } from "@/lib/supabase/server";
import { buildInitials, type DashboardUser } from "@/components/dashboard/dashboard-user";
import type { ClientContext } from "./types";

export interface ClientSession {
  userId: string;
  user: DashboardUser;
  context: ClientContext;
}

function firstName(fullName: string | null): string | null {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

/**
 * Builds the client's onboarding context without redirecting — safe to call
 * from route handlers / server actions. Returns null if not a signed-in client.
 */
export async function getClientContextForApi(): Promise<ClientContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchProfile(supabase, user.id);
  if (!profile || profile.role !== "client") return null;

  const onboarding = await fetchClientOnboarding(supabase, user.id);
  return {
    fullName: profile.full_name,
    firstName: firstName(profile.full_name),
    companyName: onboarding?.company_name ?? null,
    sector: onboarding?.sector ?? null,
    projectType: onboarding?.project_type ?? null,
    problem: onboarding?.problem ?? null,
    timeline: onboarding?.timeline ?? null,
    budgetRange: onboarding?.budget_range ?? null,
  };
}

/**
 * Loads the signed-in client, their profile and onboarding context. Redirects
 * unauthenticated users to login and non-clients to their onboarding. Shared by
 * the dashboard layout and the standalone new-project page.
 */
export async function loadClientSession(): Promise<ClientSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(supabase, user.id);
  if (!profile || profile.role !== "client") {
    redirect("/onboarding/client");
  }

  const onboarding = await fetchClientOnboarding(supabase, user.id);

  const fullName = profile.full_name;
  const email = profile.email ?? user.email ?? null;

  return {
    userId: user.id,
    user: {
      fullName,
      firstName: firstName(fullName),
      company: onboarding?.company_name ?? null,
      email,
      initials: buildInitials(fullName, email),
    },
    context: {
      fullName,
      firstName: firstName(fullName),
      companyName: onboarding?.company_name ?? null,
      sector: onboarding?.sector ?? null,
      projectType: onboarding?.project_type ?? null,
      problem: onboarding?.problem ?? null,
      timeline: onboarding?.timeline ?? null,
      budgetRange: onboarding?.budget_range ?? null,
    },
  };
}
