import { UsersRound } from "lucide-react";

import { ClientDeveloperDirectory } from "@/components/dashboard/client-developer-directory";
import { fetchClientDevelopers } from "@/lib/dashboard/client-workspace-data";
import { loadClientSession } from "@/lib/dashboard/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DevelopersPage() {
  const { userId } = await loadClientSession();
  const supabase = await createClient();
  const developers = await fetchClientDevelopers(createAdminClient() ?? supabase, userId);
  const activeCount = developers.filter((developer) =>
    developer.projects.some((project) => ["assigned", "active"].includes(project.assignmentStatus))
  ).length;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="cue text-navy-mid/70">Your delivery network</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">Your developers</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            The certified people working on your projects, plus teammates from completed work. Open a profile or continue the secure project conversation.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 rounded-full border border-accent-teal/15 bg-white/70 px-4 py-2 text-xs font-bold text-accent-teal shadow-soft sm:flex">
          <UsersRound className="size-4" aria-hidden /> {activeCount} working now
        </div>
      </div>

      <ClientDeveloperDirectory developers={developers} />
    </div>
  );
}
