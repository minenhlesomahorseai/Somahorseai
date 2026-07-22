import { ProjectMessages } from "@/components/dashboard/client-messages";
import { fetchTalentMessageThreads } from "@/lib/dashboard/client-workspace-data";
import { loadTalentSession } from "@/lib/dashboard/talent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TalentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const [{ userId }, query] = await Promise.all([loadTalentSession(), searchParams]);
  const supabase = await createClient();
  const threads = await fetchTalentMessageThreads(createAdminClient() ?? supabase, userId);
  const selectedProjectId = threads.some((thread) => thread.projectId === query.project)
    ? query.project
    : threads[0]?.projectId;

  return (
    <ProjectMessages
      initialThreads={threads}
      currentUserId={userId}
      initialProjectId={selectedProjectId ?? null}
      viewerRole="talent"
    />
  );
}
