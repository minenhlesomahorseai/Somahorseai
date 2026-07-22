import { MessagesSquare, Paperclip, Search, Send, Sparkles } from "lucide-react";

import { PreviewPill, TalentGlassCard, TalentPageHeader } from "@/components/dashboard/talent-ui";
import { fetchTalentProjects, loadTalentSession } from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/server";

export default async function TalentMessagesPage() {
  await loadTalentSession();
  const supabase = await createClient();
  const projects = await fetchTalentProjects(supabase);

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Collaboration"
        title="Messages"
        description="Project conversations, delivery updates, and support will stay together here."
        action={<PreviewPill />}
      />

      <TalentGlassCard className="overflow-hidden p-0">
        <div className="grid min-h-[34rem] md:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border-b border-white/70 bg-white/28 p-4 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy">Conversations</h2>
              <span className="grid size-8 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid">
                <MessagesSquare className="size-4" aria-hidden />
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/70 bg-white/55 px-3 py-2.5 text-muted-foreground">
              <Search className="size-4" aria-hidden />
              <span className="text-xs">Search messages</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl border border-blue-vivid/15 bg-blue-vivid/8 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-vivid text-xs font-bold text-white">SA</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-navy">Somahorse talent team</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Your workspace is ready.</p>
                  </div>
                </div>
              </div>
              {projects.slice(0, 3).map((project) => (
                <div key={project.project_id} className="rounded-2xl bg-white/38 p-3 opacity-70">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-blue-light text-xs font-bold text-navy-mid">
                      {project.title.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-navy">{project.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Project channel</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[28rem] flex-col">
            <div className="flex items-center justify-between border-b border-white/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-vivid text-xs font-bold text-white">
                  SA <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-accent-teal" />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">Somahorse talent team</p>
                  <p className="text-[11px] text-accent-teal">Workspace preview</p>
                </div>
              </div>
              <PreviewPill />
            </div>

            <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
              <div className="mx-auto max-w-md text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-vivid/10 text-blue-vivid">
                  <Sparkles className="size-7" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-navy">One place for project context</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">When messaging launches, each assignment will have a dedicated channel, shared files, and searchable delivery history.</p>
              </div>
            </div>

            <div className="border-t border-white/70 p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-white/75 bg-white/55 p-2">
                <button type="button" disabled aria-label="Attach file" className="grid size-9 place-items-center text-muted-foreground/45">
                  <Paperclip className="size-4" aria-hidden />
                </button>
                <span className="flex-1 text-xs text-muted-foreground/60">Messaging is coming soon…</span>
                <button type="button" disabled aria-label="Send message" className="grid size-9 place-items-center rounded-xl bg-navy/10 text-navy/30">
                  <Send className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </section>
        </div>
      </TalentGlassCard>
    </div>
  );
}
