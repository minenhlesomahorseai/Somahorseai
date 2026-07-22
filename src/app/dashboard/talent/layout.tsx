import { TalentDashboardShell } from "@/components/dashboard/talent-dashboard-shell";
import { loadTalentSession, type TalentNotification } from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/server";

export default async function TalentDashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, user } = await loadTalentSession();
  const supabase = await createClient();
  const [notificationsResult, invitationsResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, message, read_at, created_at")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("project_assignments")
      .select("id", { count: "exact", head: true })
      .eq("talent_id", userId)
      .eq("status", "proposed"),
  ]);

  return (
    <TalentDashboardShell
      user={user}
      notifications={(notificationsResult.data ?? []) as TalentNotification[]}
      inviteCount={invitationsResult.count ?? 0}
    >
      {children}
    </TalentDashboardShell>
  );
}
