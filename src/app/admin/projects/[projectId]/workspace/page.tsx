import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ProjectWorkspace, ProjectWorkspaceBootstrap } from "@/components/projects/project-workspace";
import { isAdminUser } from "@/lib/auth/admin";
import { paddleCheckoutConfigured } from "@/lib/payments/paddle";
import { fetchProjectWorkspaceData } from "@/lib/projects/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/projects/${projectId}/workspace`);
  if (!(await isAdminUser(supabase, user))) redirect("/");

  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for project workspaces");
  const data = await fetchProjectWorkspaceData(admin, projectId);
  if (!data) notFound();

  return (
    <main className="talent-field min-h-screen px-4 py-5 sm:px-6 lg:py-7">
      <div className="mx-auto max-w-7xl">
        <Link href={`/admin/projects/${projectId}`} className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-navy-mid"><ArrowLeft className="size-4" aria-hidden /> Admin project record</Link>
        {!data.workspace || data.milestones.length === 0 ? (
          <ProjectWorkspaceBootstrap projectId={projectId} role="admin" />
        ) : (
          <ProjectWorkspace data={data} role="admin" currentUserId={user.id} paymentReady={paddleCheckoutConfigured()} />
        )}
      </div>
    </main>
  );
}
