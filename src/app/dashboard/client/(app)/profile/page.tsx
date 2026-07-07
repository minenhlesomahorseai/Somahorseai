import Link from "next/link";
import {
  Activity,
  Building2,
  CalendarClock,
  FolderKanban,
  Mail,
  MapPin,
  Pencil,
  Sprout,
  Wallet,
} from "lucide-react";

import { Tile, TileHeader } from "@/components/dashboard/ui";
import { fetchClientProjects } from "@/lib/dashboard/data";
import { loadClientSession } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  CLIENT_BUDGETS,
  CLIENT_PROJECT_TYPES,
  CLIENT_SECTORS,
  CLIENT_TIMELINES,
  optionLabel,
} from "@/lib/onboarding/options";

export default async function ProfilePage() {
  const { userId, user, context } = await loadClientSession();
  const supabase = await createClient();
  const projects = await fetchClientProjects(supabase, userId);
  const liveCount = projects.filter(
    (p) => p.status === "monitoring" || p.status === "delivered"
  ).length;

  const sectorLabel = optionLabel(CLIENT_SECTORS, context.sector);

  const details = [
    { icon: Building2, label: "Company", value: context.companyName ?? "—" },
    { icon: Sprout, label: "Sector", value: sectorLabel ?? "—" },
    { icon: Mail, label: "Email", value: user.email ?? "—" },
    {
      icon: FolderKanban,
      label: "Interested in",
      value: optionLabel(CLIENT_PROJECT_TYPES, context.projectType) ?? "—",
    },
    {
      icon: CalendarClock,
      label: "Timeline",
      value: optionLabel(CLIENT_TIMELINES, context.timeline) ?? "—",
    },
    {
      icon: Wallet,
      label: "Budget",
      value: optionLabel(CLIENT_BUDGETS, context.budgetRange) ?? "—",
    },
  ];

  const stats = [
    { label: "Projects", value: projects.length },
    { label: "Live systems", value: liveCount },
    { label: "Member since", value: "2026" },
  ];

  return (
    <div className="space-y-6">
      {/* Cover + identity */}
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/80 shadow-card">
        <div className="relative h-40 bg-gradient-to-br from-navy via-navy-mid to-blue-vivid sm:h-52">
          <div className="pointer-events-none absolute inset-0 dotted-grid opacity-20" />
          <div className="pointer-events-none absolute -right-8 top-6 size-40 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="px-5 pb-5 sm:px-8 sm:pb-7">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span className="grid size-24 shrink-0 place-items-center rounded-3xl border-4 border-white bg-navy font-display text-2xl font-bold text-white shadow-elevated sm:size-28">
                {user.initials}
              </span>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  {context.companyName ?? user.fullName ?? "Your company"}
                </h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {user.fullName ? <span>{user.fullName}</span> : null}
                  {sectorLabel ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden /> {sectorLabel}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/client/settings"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border-strong bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-blue-mist"
            >
              <Pencil className="size-3.5" aria-hidden /> Edit profile
            </Link>
          </div>

          <div className="mt-6 flex gap-8 border-t border-border/60 pt-5">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-xl font-bold text-navy">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About + details */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Tile className="lg:col-span-2">
          <TileHeader title="About" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {context.problem ??
              `${
                context.companyName ?? "This organisation"
              } is working with Somahorse.ai to build and run AI systems${
                sectorLabel ? ` for ${sectorLabel.toLowerCase()}` : ""
              }. Project details captured during onboarding power the Intake agent when scoping new work.`}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {details.map((detail) => {
              const Icon = detail.icon;
              return (
                <div
                  key={detail.label}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-white/60 p-3.5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-light/70 text-navy-mid">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{detail.label}</p>
                    <p className="truncate text-sm font-semibold text-navy">{detail.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Tile>

        <Tile>
          <TileHeader title="Activity" href="/dashboard/client/projects" icon={Activity} />
          {projects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-white/50 p-5 text-center text-sm text-muted-foreground">
              No activity yet. Your projects will show up here.
            </p>
          ) : (
            <ul className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id} className="flex items-start gap-3">
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-blue-light/70 text-navy-mid">
                    <FolderKanban className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>
    </div>
  );
}
