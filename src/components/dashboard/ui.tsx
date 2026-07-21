import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Tile({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-border/70 bg-white/80 p-5 shadow-card backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function TileHeader({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="grid size-7 place-items-center rounded-lg bg-blue-light/70 text-navy-mid">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        <h3 className="font-ui text-base font-bold text-navy">{title}</h3>
      </div>
      {href ? (
        <Link
          href={href}
          aria-label={`Open ${title}`}
          className="grid size-8 place-items-center rounded-full border border-border/80 bg-white text-navy-mid transition hover:bg-blue-mist"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function StatBadge({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-blue-light/70 text-navy-mid">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="font-display text-2xl font-bold text-navy sm:text-3xl">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    scoping: "bg-blue-light text-navy-mid",
    awaiting_payment: "bg-accent-amber/15 text-accent-amber",
    matching: "bg-accent-amber/15 text-accent-amber",
    in_build: "bg-blue-vivid/12 text-blue-vivid",
    monitoring: "bg-accent-teal/12 text-accent-teal",
    delivered: "bg-navy/10 text-navy",
    cancelled: "bg-navy/10 text-muted-foreground",
  };
  const labels: Record<string, string> = {
    scoping: "Scoping",
    awaiting_payment: "Awaiting payment",
    matching: "Matching team",
    in_build: "In build",
    monitoring: "Monitoring",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        tones[status] ?? "bg-blue-light text-navy-mid"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
