import { notFound } from "next/navigation";

import { ProjectWorkspace, ProjectWorkspaceBootstrap } from "@/components/projects/project-workspace";
import { loadTalentSession } from "@/lib/dashboard/talent";
import { fetchProjectWorkspaceData } from "@/lib/projects/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TalentProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { userId } = await loadTalentSession();
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("project_id", projectId)
    .eq("talent_id", userId)
    .in("status", ["assigned", "active", "completed"])
    .maybeSingle();
  if (!assignment) notFound();

  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for project workspaces");
  const data = await fetchProjectWorkspaceData(admin, projectId);
  if (!data) notFound();
  if (!data.workspace || data.milestones.length === 0) {
    return <ProjectWorkspaceBootstrap projectId={projectId} role="talent" />;
  }
  return <ProjectWorkspace data={data} role="talent" currentUserId={userId} paymentReady={false} />;
}
