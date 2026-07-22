import { notFound } from "next/navigation";

import { ProjectWorkspace, ProjectWorkspaceBootstrap } from "@/components/projects/project-workspace";
import { loadClientSession } from "@/lib/dashboard/session";
import { paddleCheckoutConfigured } from "@/lib/payments/paddle";
import { fetchProjectWorkspaceData } from "@/lib/projects/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function ClientProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const { userId } = await loadClientSession();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_id", userId)
    .maybeSingle();
  if (!project) notFound();

  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for project workspaces");
  const data = await fetchProjectWorkspaceData(admin, projectId);
  if (!data) notFound();
  if (!data.workspace || data.milestones.length === 0) {
    return <ProjectWorkspaceBootstrap projectId={projectId} role="client" />;
  }

  return (
    <ProjectWorkspace
      data={data}
      role="client"
      currentUserId={userId}
      paymentReady={paddleCheckoutConfigured()}
      paymentConfirmed={query.payment === "confirmed"}
    />
  );
}
