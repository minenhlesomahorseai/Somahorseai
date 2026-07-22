import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function TalentGlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`talent-glass rounded-[1.75rem] p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function TalentPageHeader({
  eyebrow = "Talent workspace",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="cue text-blue-vivid/80">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function TalentSectionTitle({
  title,
  icon: Icon,
  href,
  linkLabel = "View all",
}: {
  title: string;
  icon: LucideIcon;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="font-display text-base font-bold text-navy sm:text-lg">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-blue-vivid transition hover:text-navy">
          {linkLabel} <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function TalentEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-blue-vivid/20 bg-white/45 px-5 py-12 text-center backdrop-blur-sm">
      <span className="grid size-14 place-items-center rounded-2xl bg-blue-vivid/10 text-blue-vivid shadow-soft">
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-lg font-bold text-navy">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function PreviewPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-vivid/10 px-3 py-1 text-[11px] font-bold text-blue-vivid">
      <Sparkles className="size-3" aria-hidden /> Preview
    </span>
  );
}
