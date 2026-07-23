import { redirect } from "next/navigation";
import { after } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import type { Profile, TalentOnboarding } from "@/lib/auth/types";
import { getEmailHealth, processPendingEmails } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

import { AdminConsole, type TalentApplication } from "./admin-console";

export const metadata = {
  title: "Admin — Somahorse.ai",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!(await isAdminUser(supabase, user))) {
    redirect("/");
  }

  after(() => processPendingEmails(25));

  const [{ data: talentRows }, emailHealth, { data: deliveryRows }] =
    await Promise.all([
      supabase
        .from("talent_onboarding")
        .select(
          "id, current_step, stage, headline, primary_role, years_experience, skills, bio, portfolio_url, github_url, country, agri_experience, assessment, admin_notes"
        )
        .order("updated_at", { ascending: true }),
      getEmailHealth(),
      supabase.from("email_deliveries").select("status"),
    ]);

  const talent = (talentRows as TalentOnboarding[] | null) ?? [];

  const ids = talent.map((row) => row.id);
  const profilesById = new Map<string, Profile>();
  if (ids.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, onboarding_status")
      .in("id", ids);
    for (const profile of (profileRows as Profile[] | null) ?? []) {
      profilesById.set(profile.id, profile);
    }
  }

  const applications: TalentApplication[] = talent.map((row) => ({
    onboarding: row,
    profile: profilesById.get(row.id) ?? null,
  }));

  const deliveryCounts = { sent: 0, pending: 0, failed: 0 };
  for (const row of deliveryRows ?? []) {
    if (row.status === "sent") deliveryCounts.sent += 1;
    if (row.status === "pending" || row.status === "sending") {
      deliveryCounts.pending += 1;
    }
    if (row.status === "failed") deliveryCounts.failed += 1;
  }

  return (
    <AdminConsole
      applications={applications}
      adminEmail={user.email ?? ""}
      emailHealth={emailHealth}
      deliveryCounts={deliveryCounts}
    />
  );
}
