import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { loadClientSession } from "@/lib/dashboard/session";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await loadClientSession();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
