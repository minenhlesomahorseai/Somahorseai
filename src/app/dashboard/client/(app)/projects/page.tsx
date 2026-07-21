import Link from "next/link";
import { Bot, CalendarClock, CheckCircle2, CreditCard, FileText, Plus, UsersRound, Wallet } from "lucide-react";

import { StatusPill } from "@/components/dashboard/ui";
import { fetchClientProjects } from "@/lib/dashboard/data";
import { loadClientSession } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import { CLIENT_BUDGETS, CLIENT_TIMELINES, optionLabel } from "@/lib/onboarding/options";
import { formatZar } from "@/lib/projects/pricing";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string }>;
}) {
  const { started } = await searchParams;
  const { userId } = await loadClientSession();
  const supabase = await createClient();
  const projects = await fetchClientProjects(supabase, userId);

  return (
    <div className="space-y-6">
      {started ? (
        <div className="flex items-start gap-3 rounded-3xl border border-accent-teal/25 bg-accent-teal/10 p-4 text-accent-teal shadow-soft" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-bold">Payment confirmed. Your project is active.</p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-80">
              The nominated specialists and Somahorse.ai control room have been alerted.
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cue text-navy-mid/70">Client dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Projects
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Every build, from first scope to live monitoring.
          </p>
        </div>
        <Link
          href="/dashboard/client/new-project"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-mid px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
        >
          <Plus className="size-4" aria-hidden /> New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/60 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blue-light/70 text-navy-mid">
            <Bot className="size-7" aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            You haven&apos;t started a project yet. Describe your problem to the Intake agent and watch
            it get scoped, priced, and staffed.
          </p>
          <Link
            href="/dashboard/client/new-project"
            className="inline-flex items-center gap-2 rounded-full bg-navy-mid px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
          >
            <Plus className="size-4" aria-hidden /> Start your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-card transition hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-navy">{project.title}</h2>
                <StatusPill status={project.status} />
              </div>
              {project.summary ? (
                <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-navy-mid">
                {project.build_fee_amount ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-light/60 px-2.5 py-1">
                    <Wallet className="size-3" aria-hidden />
                    {formatZar(project.build_fee_amount)} build
                  </span>
                ) : null}
                {project.budget_range ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-light/60 px-2.5 py-1">
                    <Wallet className="size-3" aria-hidden />
                    {optionLabel(CLIENT_BUDGETS, project.budget_range)}
                  </span>
                ) : null}
                {project.timeline ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-light/60 px-2.5 py-1">
                    <CalendarClock className="size-3" aria-hidden />
                    {optionLabel(CLIENT_TIMELINES, project.timeline)}
                  </span>
                ) : null}
                {(project.matched_team?.length ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal/12 px-2.5 py-1 text-accent-teal">
                    <UsersRound className="size-3" aria-hidden />
                    {project.matched_team!.length} matched
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                {project.payment_status === "pending" && project.paddle_transaction_id ? (
                  <Link
                    href={`/dashboard/client/checkout/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy-mid px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-navy"
                  >
                    <CreditCard className="size-3.5" aria-hidden /> Pay deposit
                    {project.deposit_amount ? ` · ${formatZar(project.deposit_amount)}` : ""}
                  </Link>
                ) : null}
                {project.payment_status === "paid" ? (
                  <a
                    href={`/api/paddle/invoice?projectId=${project.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-navy-mid transition hover:bg-blue-mist"
                  >
                    <FileText className="size-3.5" aria-hidden /> Invoice
                  </a>
                ) : null}
                {project.monthly_fee_amount ? (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {formatZar(project.monthly_fee_amount)} monthly after launch
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
