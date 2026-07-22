import { ClientMessages } from "@/components/dashboard/client-messages";
import { fetchClientMessageThreads } from "@/lib/dashboard/client-workspace-data";
import { loadClientSession } from "@/lib/dashboard/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const [{ userId }, query] = await Promise.all([loadClientSession(), searchParams]);
  const supabase = await createClient();
  const threads = await fetchClientMessageThreads(createAdminClient() ?? supabase, userId);
  const selectedProjectId = threads.some((thread) => thread.projectId === query.project)
    ? query.project
    : threads[0]?.projectId;

  return <ClientMessages initialThreads={threads} currentUserId={userId} initialProjectId={selectedProjectId ?? null} />;
}
