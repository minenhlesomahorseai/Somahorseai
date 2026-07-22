import { BriefcaseBusiness, CalendarClock, CheckCircle2, FolderKanban, Layers3 } from "lucide-react";

import { TalentEmptyState, TalentGlassCard, TalentPageHeader } from "@/components/dashboard/talent-ui";
import { fetchTalentProjects, loadTalentSession, type TalentProject } from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/server";

export default async function TalentProjectsPage() {
  await loadTalentSession();
  const supabase = await createClient();
  const projects = await fetchTalentProjects(supabase);
  const current = projects.filter((project) => ["assigned", "active"].includes(project.assignment_status));
  const completed = projects.filter((project) => project.assignment_status === "completed");

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Delivery workspace"
        title="Your projects"
        description="Track the assignments you are building now and the work already completed."
        action={
          <div className="grid grid-cols-2 gap-2">
            <ProjectStat value={current.length} label="Current" />
            <ProjectStat value={completed.length} label="Completed" />
          </div>
        }
      />

      {projects.length === 0 ? (
        <TalentEmptyState
          icon={FolderKanban}
          title="Your project workspace is ready"
          description="Assigned work will appear here with your role, delivery timeline, and current status. Explore Invites to see new opportunities."
        />
      ) : (
        <div className="space-y-7">
          {current.length ? <ProjectGroup title="In progress" projects={current} active /> : null}
          {completed.length ? <ProjectGroup title="Completed" projects={completed} /> : null}
        </div>
      )}
    </div>
  );
}

function ProjectGroup({ title, projects, active = false }: { title: string; projects: TalentProject[]; active?: boolean }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${active ? "talent-live-dot bg-accent-teal" : "bg-blue-vivid/40"}`} />
        <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
        <span className="text-xs font-semibold text-muted-foreground">{projects.length}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <TalentGlassCard key={project.project_id} className="talent-card-enter flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-vivid/10 text-blue-vivid">
                {active ? <Layers3 className="size-5" aria-hidden /> : <CheckCircle2 className="size-5" aria-hidden />}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${active ? "bg-accent-teal/10 text-accent-teal" : "bg-navy/8 text-navy"}`}>
                {project.project_status.replaceAll("_", " ")}
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-navy">{project.title}</h3>
            <p className="mt-1 text-xs font-bold text-blue-vivid">{project.assignment_role}</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {project.summary ?? "Project details are being prepared by the delivery team."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/70 pt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 text-xs font-semibold capitalize text-navy-mid">
                <BriefcaseBusiness className="size-3.5" aria-hidden /> {project.assignment_status}
              </span>
              {project.timeline_weeks ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 text-xs font-semibold text-navy-mid">
                  <CalendarClock className="size-3.5" aria-hidden /> {project.timeline_weeks} weeks
                </span>
              ) : null}
            </div>
          </TalentGlassCard>
        ))}
      </div>
    </section>
  );
}

function ProjectStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="talent-glass min-w-24 rounded-2xl px-4 py-3 text-center">
      <p className="font-display text-xl font-bold leading-none text-navy">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}
