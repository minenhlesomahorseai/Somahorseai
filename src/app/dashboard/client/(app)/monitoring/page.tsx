import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  HeartPulse,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { fetchClientMonitoringProjects } from "@/lib/dashboard/client-workspace-data";
import { loadClientSession } from "@/lib/dashboard/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MonitoringPage() {
  const { userId, user } = await loadClientSession();
  const supabase = await createClient();
  const projects = await fetchClientMonitoringProjects(createAdminClient() ?? supabase, userId);
  const running = projects.filter((project) => project.status === "in_build");
  const supported = projects.filter((project) => ["monitoring", "delivered"].includes(project.status));
  const actionNeeded = projects.filter((project) => project.paymentDue > 0);
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="cue text-navy-mid/70">Quick project check</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            How your work is going
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            A plain-language view of progress, what the team is doing now, and anything that needs your attention.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-teal/15 bg-white/75 px-3.5 py-2 text-xs font-bold text-accent-teal shadow-soft">
          <span className="talent-live-dot size-2 rounded-full bg-accent-teal" /> Live updates
        </span>
      </div>

      {projects.length ? (
        <>
          <section className={`rounded-[1.75rem] border p-5 shadow-card sm:p-6 ${actionNeeded.length ? "border-accent-amber/20 bg-accent-amber/8" : "border-accent-teal/15 bg-accent-teal/8"}`}>
            <div className="flex items-start gap-3">
              <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${actionNeeded.length ? "bg-accent-amber/15 text-accent-amber" : "bg-accent-teal/12 text-accent-teal"}`}>
                {actionNeeded.length ? <AlertCircle className="size-5" aria-hidden /> : <ShieldCheck className="size-5" aria-hidden />}
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-navy">
                  {actionNeeded.length
                    ? `${actionNeeded.length} ${actionNeeded.length === 1 ? "project needs" : "projects need"} your attention`
                    : `Everything looks good${user.firstName ? `, ${user.firstName}` : ""}`}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {actionNeeded.length
                    ? "A completed stage is ready for payment. The project card below shows exactly where to go."
                    : "Your project teams can keep moving. There are no completed stages waiting for payment."}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuickMetric icon={FolderKanban} value={String(running.length)} label="Being built" />
            <QuickMetric icon={Activity} value={`${averageProgress}%`} label="Average progress" />
            <QuickMetric icon={HeartPulse} value={String(supported.length)} label="Live or supported" />
            <QuickMetric icon={AlertCircle} value={String(actionNeeded.length)} label="Need your input" warning={actionNeeded.length > 0} />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-vivid">Your systems</p>
                <h2 className="mt-1 font-display text-xl font-bold text-navy">Project-by-project</h2>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">Updated from each shared workspace</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {projects.map((project) => {
                const status = explainStatus(project.status, project.progress);
                const daysRemaining = getDaysRemaining(project.expectedCompletionAt);
                return (
                  <article key={project.id} className="workspace-glass min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.tone}`}>
                          <span className="size-1.5 rounded-full bg-current" /> {status.label}
                        </span>
                        <h3 className="mt-3 truncate font-display text-xl font-bold text-navy">{project.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.summary ?? status.explanation}</p>
                      </div>
                      <span className="shrink-0 font-display text-3xl font-bold text-navy">{project.progress}%</span>
                    </div>

                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-blue-light">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-vivid to-accent-teal transition-[width] duration-700" style={{ width: `${project.progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold text-muted-foreground">
                      <span>{project.completedTasks} of {project.totalTasks || "—"} team tasks complete</span>
                      <span>{project.progress === 100 ? "Work complete" : daysRemaining == null ? "Date being planned" : `${daysRemaining} days left`}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <PlainDetail icon={CheckCircle2} label="Happening now" value={project.currentMilestone ?? "Plan being prepared"} />
                      <PlainDetail icon={UsersRound} label="People working" value={`${project.teamSize} certified ${project.teamSize === 1 ? "developer" : "developers"}`} />
                    </div>

                    {project.paymentDue > 0 ? (
                      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-amber/10 p-3 text-accent-amber">
                        <CircleDollarSign className="size-5 shrink-0" aria-hidden />
                        <div className="min-w-0"><p className="text-xs font-bold">A finished stage is ready for payment</p><p className="mt-0.5 text-[10px] opacity-80">Open the workspace to review and pay {formatZar(project.paymentDue)}.</p></div>
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-center justify-between border-t border-white/75 pt-4">
                      <p className="inline-flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        <CalendarClock className="size-3.5 shrink-0" aria-hidden /> {status.explanation}
                      </p>
                      <Link href={`/dashboard/client/projects/${project.id}`} className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3.5 py-2 text-[11px] font-bold text-white shadow-glow">
                        Open <ArrowUpRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="workspace-glass flex min-h-[25rem] flex-col items-center justify-center rounded-[2rem] px-6 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-blue-vivid/10 text-blue-vivid"><Activity className="size-7" aria-hidden /></span>
          <h2 className="mt-5 font-display text-2xl font-bold text-navy">Nothing to monitor yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">When a funded project starts, this page becomes your quick, everyday view of its progress.</p>
          <Link href="/dashboard/client/projects" className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-glow">View projects <ArrowUpRight className="size-4" aria-hidden /></Link>
        </section>
      )}
    </div>
  );
}

function QuickMetric({ icon: Icon, value, label, warning = false }: { icon: typeof Activity; value: string; label: string; warning?: boolean }) {
  return <div className="workspace-glass min-w-0 rounded-3xl p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><span className={`grid size-8 shrink-0 place-items-center rounded-xl ${warning ? "bg-accent-amber/12 text-accent-amber" : "bg-blue-vivid/10 text-blue-vivid"}`}><Icon className="size-4" aria-hidden /></span><p className="truncate font-display text-2xl font-bold text-navy sm:text-3xl">{value}</p></div><p className="mt-3 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:text-xs">{label}</p></div>;
}

function PlainDetail({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl bg-white/50 p-3"><span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground"><Icon className="size-3 text-blue-vivid" aria-hidden />{label}</span><p className="mt-1.5 line-clamp-2 text-xs font-bold leading-5 text-navy">{value}</p></div>;
}

function explainStatus(status: string, progress: number) {
  if (status === "delivered") return { label: "Work complete", explanation: "The build is finished and ready for ongoing support.", tone: "bg-navy/8 text-navy" };
  if (status === "monitoring") return { label: "Live and supported", explanation: "The system is live and the team is watching its health.", tone: "bg-accent-teal/10 text-accent-teal" };
  if (progress >= 90) return { label: "Almost finished", explanation: "The team is completing the final checks before handover.", tone: "bg-accent-teal/10 text-accent-teal" };
  if (progress > 0) return { label: "Work in progress", explanation: "The team is actively working through the agreed plan.", tone: "bg-blue-vivid/10 text-blue-vivid" };
  return { label: "Getting started", explanation: "The project plan and first pieces of work are being prepared.", tone: "bg-accent-amber/10 text-accent-amber" };
}

function getDaysRemaining(value: string | null) {
  if (!value) return null;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

function formatZar(value: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}
