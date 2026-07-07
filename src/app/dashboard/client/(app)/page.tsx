import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Building2,
  CheckCircle2,
  Circle,
  FolderKanban,
  Plus,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { Tile, TileHeader, StatBadge, StatusPill } from "@/components/dashboard/ui";
import { fetchAvailableDevelopers, fetchClientProjects } from "@/lib/dashboard/data";
import { loadClientSession } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import { optionLabel, CLIENT_SECTORS } from "@/lib/onboarding/options";

export default async function ClientOverviewPage() {
  const { userId, user, context } = await loadClientSession();
  const supabase = await createClient();
  const [projects, developers] = await Promise.all([
    fetchClientProjects(supabase, userId),
    fetchAvailableDevelopers(supabase),
  ]);

  const live = projects.filter((p) => p.status === "monitoring" || p.status === "delivered");
  const inBuild = projects.filter((p) => p.status === "in_build");
  const scoping = projects.filter((p) => p.status === "scoping" || p.status === "matching");
  const networkSize = developers.length > 0 ? developers.length : 900;

  const pipeline = [
    { label: "Scoping", count: scoping.length, tone: "bg-blue-light" },
    { label: "In build", count: inBuild.length, tone: "bg-blue-vivid/30" },
    { label: "Live", count: live.length, tone: "bg-accent-teal/40" },
  ];
  const totalPipeline = Math.max(
    pipeline.reduce((sum, p) => sum + p.count, 0),
    1
  );

  const tasks = [
    { label: "Describe your first project", done: projects.length > 0 },
    { label: "Approve your scoped plan", done: projects.some((p) => p.scope) },
    { label: "Match your certified team", done: projects.some((p) => (p.matched_team?.length ?? 0) > 0) },
    { label: "Kick off the build", done: inBuild.length + live.length > 0 },
    { label: "Start a monitoring agreement", done: live.length > 0 },
  ];
  const tasksDone = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      {/* Greeting + headline numbers */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="cue text-navy-mid/70">Client dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Welcome{user.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {context.companyName
              ? `Here's what's happening at ${context.companyName} today.`
              : "Here's what your AI team is working on today."}
          </p>
        </div>
        <div className="flex items-center gap-6 sm:gap-9">
          <StatBadge value={String(networkSize)} label="Developers" icon={UsersRound} />
          <StatBadge value={String(live.length)} label="Monitored" icon={Activity} />
          <StatBadge value={String(projects.length)} label="Projects" icon={FolderKanban} />
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Company card */}
        <Tile className="lg:col-span-4 lg:row-span-2 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-navy via-navy-mid to-blue-vivid p-0 text-white">
          <div className="relative flex h-full flex-col justify-between p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Building2 className="size-3.5" aria-hidden /> Company
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-white/15 font-display text-lg font-bold backdrop-blur">
                {user.initials}
              </span>
            </div>
            <div className="mt-10">
              <h2 className="font-display text-2xl font-bold leading-tight">
                {context.companyName ?? user.fullName ?? "Your company"}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {optionLabel(CLIENT_SECTORS, context.sector) ?? "Agriculture"} ·{" "}
                {context.timeline ? "Active client" : "New client"}
              </p>
              <Link
                href="/dashboard/client/profile"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-blue-mist"
              >
                View profile <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Tile>

        {/* Pipeline */}
        <Tile className="lg:col-span-5">
          <TileHeader title="Project pipeline" href="/dashboard/client/projects" icon={TrendingUp} />
          <div className="flex items-end gap-4">
            <p className="font-display text-4xl font-bold text-navy">{projects.length}</p>
            <p className="pb-1.5 text-sm text-muted-foreground">total projects</p>
          </div>
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-blue-mist">
            {pipeline.map((p) => (
              <div
                key={p.label}
                className={p.tone}
                style={{ width: `${(p.count / totalPipeline) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {pipeline.map((p) => (
              <span key={p.label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`size-2.5 rounded-full ${p.tone}`} /> {p.label} · {p.count}
              </span>
            ))}
          </div>
        </Tile>

        {/* Intake agent CTA */}
        <Tile className="lg:col-span-3 flex flex-col justify-between">
          <TileHeader title="Intake agent" icon={Bot} />
          <p className="text-sm text-muted-foreground">
            Describe a problem in plain language. Get a scoped, costed plan in minutes.
          </p>
          <Link
            href="/dashboard/client/new-project"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-navy-mid px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
          >
            <Plus className="size-4" aria-hidden /> New project
          </Link>
        </Tile>

        {/* MRR / monitoring */}
        <Tile className="lg:col-span-5">
          <TileHeader title="Monthly recurring" icon={Activity} />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-4xl font-bold text-navy">
                R{(live.length * 18000).toLocaleString("en-ZA")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {live.length} monitoring {live.length === 1 ? "agreement" : "agreements"} active
              </p>
            </div>
            <span className="grid size-16 place-items-center rounded-2xl bg-accent-teal/12 text-accent-teal">
              <TrendingUp className="size-7" aria-hidden />
            </span>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-blue-light/40 p-3 text-xs text-navy-mid">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-blue-vivid" />
            Every delivered system becomes a system we monitor — turning builds into recurring revenue.
          </p>
        </Tile>

        {/* Onboarding tasks */}
        <Tile className="lg:col-span-3 lg:row-span-2 flex flex-col bg-navy text-white">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Get started</h3>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">
              {tasksDone}/{tasks.length}
            </span>
          </div>
          <ul className="flex-1 space-y-3">
            {tasks.map((task) => (
              <li key={task.label} className="flex items-start gap-2.5 text-sm">
                {task.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-teal" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden />
                )}
                <span className={task.done ? "text-white/50 line-through" : "text-white/90"}>
                  {task.label}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/client/new-project"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-blue-mist"
          >
            Continue setup <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Tile>

        {/* Recent projects */}
        <Tile className="lg:col-span-9">
          <TileHeader title="Recent projects" href="/dashboard/client/projects" icon={FolderKanban} />
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-10 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-blue-light/70 text-navy-mid">
                <Bot className="size-6" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                No projects yet. Start by describing your problem to the Intake agent.
              </p>
              <Link
                href="/dashboard/client/new-project"
                className="inline-flex items-center gap-2 rounded-full bg-navy-mid px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
              >
                <Plus className="size-4" aria-hidden /> New project
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {projects.slice(0, 4).map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{project.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.summary ?? "Awaiting scope"}
                    </p>
                  </div>
                  <StatusPill status={project.status} />
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>
    </div>
  );
}
