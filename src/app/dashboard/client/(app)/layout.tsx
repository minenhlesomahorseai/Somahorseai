import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardNotification } from "@/lib/dashboard/notifications";
import { loadClientSession } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userId } = await loadClientSession();
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, project_id, type, title, message, payload, read_at, created_at")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (
    <DashboardShell
      user={user}
      userId={userId}
      initialNotifications={(notifications ?? []) as DashboardNotification[]}
    >
      {children}
    </DashboardShell>
  );
}
