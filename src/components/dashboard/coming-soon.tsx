import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon,
  points,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="cue text-navy-mid/70">Client dashboard</p>
        <h1 className="mt-1 font-ui text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/80 p-8 shadow-card">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-blue-light/70 text-navy-mid">
            <Icon className="size-8" aria-hidden />
          </span>
          <div>
            <span className="inline-flex items-center rounded-full bg-accent-amber/15 px-3 py-1 text-xs font-bold text-accent-amber">
              Coming soon
            </span>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              This space is reserved. Here&apos;s what will live here:
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 rounded-2xl border border-border bg-white/60 p-4 text-sm text-navy"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-vivid" />
              {point}
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/client"
          className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-blue-mist font-ui"
        >
          Back to dashboard <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
