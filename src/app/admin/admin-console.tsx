"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  ClipboardCheck,
  Video,
  CheckCircle2,
  XCircle,
  Trophy,
  ExternalLink,
  FolderKanban,
  Mail,
  MailCheck,
  MailWarning,
  RefreshCw,
} from "lucide-react";

import type { Profile, TalentOnboarding, TalentStage } from "@/lib/auth/types";
import type { EmailHealth } from "@/lib/email";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";

import { retryEmailDeliveries, setTalentStage } from "./actions";

export interface TalentApplication {
  onboarding: TalentOnboarding;
  profile: Profile | null;
}

const REVIEW_STAGES: {
  stage: TalentStage;
  label: string;
  approveLabel?: string;
  approveTo?: TalentStage;
  icon: typeof Clock;
}[] = [
  {
    stage: "pending_review",
    label: "Application review",
    approveLabel: "Approve → Assessment",
    approveTo: "assessment",
    icon: Clock,
  },
  {
    stage: "assessment_review",
    label: "Assessment review",
    approveLabel: "Pass → Interview",
    approveTo: "interview",
    icon: ClipboardCheck,
  },
  {
    stage: "interview",
    label: "Interview scheduling",
    icon: Video,
  },
  {
    stage: "interview_review",
    label: "Interview outcome",
    approveLabel: "Pass → Certify",
    approveTo: "approved",
    icon: Video,
  },
];

const STAGE_LABELS: Record<TalentStage, string> = {
  profile: "Filling profile",
  pending_review: "Awaiting review",
  assessment: "Taking assessment",
  assessment_review: "Assessment review",
  interview: "Interview stage",
  interview_review: "Interview confirmed",
  approved: "Approved",
  rejected: "Rejected",
};

export function AdminConsole({
  applications,
  adminEmail,
  emailHealth,
  deliveryCounts,
}: {
  applications: TalentApplication[];
  adminEmail: string;
  emailHealth: EmailHealth;
  deliveryCounts: { sent: number; pending: number; failed: number };
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of applications) {
      map.set(app.onboarding.stage, (map.get(app.onboarding.stage) ?? 0) + 1);
    }
    return map;
  }, [applications]);

  const actionable = REVIEW_STAGES.map((config) => ({
    config,
    items: applications.filter((a) => a.onboarding.stage === config.stage),
  }));

  const others = applications.filter(
    (a) =>
      !REVIEW_STAGES.some((s) => s.stage === a.onboarding.stage)
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background hero-field dotted-grid">
      <div className="pointer-events-none absolute -top-40 right-1/4 size-[600px] rounded-full bg-navy-mid/10 blur-[140px]" />

      <header className="relative z-10 border-b border-border/60 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/somahorse-logo.png"
              alt="Somahorse.ai"
              width={32}
              height={32}
              className="size-8 rounded-full object-contain"
              priority
            />
            <span className="font-display text-base font-bold text-navy">
              Somahorse<span className="text-blue-vivid">.ai</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-mid px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-navy"
            >
              <FolderKanban className="size-3.5" /> Projects
            </Link>
            <Link
              href="/admin/emails"
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-mid/20 bg-white px-3.5 py-2 text-xs font-semibold text-navy-mid shadow-soft transition hover:bg-blue-mist"
            >
              <Mail className="size-3.5" /> Email inbox
            </Link>
            <span className="hidden items-center gap-2 rounded-full border border-navy-mid/20 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-navy-mid shadow-soft sm:inline-flex">
              <ShieldCheck className="size-3.5" />
              Admin · {adminEmail}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-navy">
            Certification console
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review talent applications and move them through the pipeline.
          </p>
        </div>

        <EmailDeliveryStatus
          health={emailHealth}
          counts={deliveryCounts}
        />

        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Awaiting review" value={counts.get("pending_review") ?? 0} icon={Clock} />
          <StatCard label="Assessment review" value={counts.get("assessment_review") ?? 0} icon={ClipboardCheck} />
          <StatCard label="Interviews" value={(counts.get("interview") ?? 0) + (counts.get("interview_review") ?? 0)} icon={Video} />
          <StatCard label="Approved" value={counts.get("approved") ?? 0} icon={Trophy} />
        </div>

        {actionable.map(({ config, items }) => (
          <section key={config.stage} className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <config.icon className="size-4 text-navy-mid" />
              <h2 className="font-display text-lg font-bold text-navy">{config.label}</h2>
              <span className="rounded-full bg-blue-light/70 px-2.5 py-0.5 text-xs font-bold text-navy-mid">
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-white/50 p-6 text-center text-sm text-muted-foreground">
                Nothing here right now.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((app) => (
                  <ApplicationCard
                    key={app.onboarding.id}
                    app={app}
                    approveLabel={config.approveLabel}
                    approveTo={config.approveTo}
                    reviewHref={
                      config.stage === "assessment_review"
                        ? `/admin/assessment/${app.onboarding.id}`
                        : config.stage === "interview"
                          ? `/admin/interviews/${app.onboarding.id}`
                        : undefined
                    }
                    reviewLabel={
                      config.stage === "interview"
                        ? "Open interview scheduling"
                        : "Open assessment review"
                    }
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {others.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 font-display text-lg font-bold text-navy">Everyone else</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-white/70">
              {others.map((app) => (
                <div
                  key={app.onboarding.id}
                  className="flex items-center justify-between border-b border-border/60 px-5 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {app.profile?.full_name ?? "Unnamed"}
                    </p>
                    <p className="text-xs text-muted-foreground">{app.profile?.email}</p>
                  </div>
                  <span className="rounded-full bg-blue-light/60 px-3 py-1 text-xs font-semibold text-navy-mid">
                    {STAGE_LABELS[app.onboarding.stage]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function EmailDeliveryStatus({
  health,
  counts,
}: {
  health: EmailHealth;
  counts: { sent: number; pending: number; failed: number };
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState("");
  const retry = () => {
    setResult("");
    startTransition(async () => {
      try {
        const next = await retryEmailDeliveries();
        setResult(
          `Processed ${next.processed}: ${next.sent} sent, ${next.failed} still waiting.`
        );
      } catch (cause) {
        setResult(cause instanceof Error ? cause.message : "Retry failed.");
      }
    });
  };

  return (
    <div
      className={`mb-8 rounded-2xl border p-5 ${
        health.configured
          ? "border-accent-teal/25 bg-accent-teal/10"
          : "border-accent-amber/25 bg-accent-amber/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              health.configured
                ? "bg-accent-teal text-white"
                : "bg-accent-amber text-white"
            }`}
          >
            {health.configured ? (
              <MailCheck className="size-5" />
            ) : (
              <MailWarning className="size-5" />
            )}
          </span>
          <div>
            <p className="font-display text-sm font-bold text-navy">
              {health.configured
                ? "Transactional email is active"
                : "Email setup needs attention"}
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {health.message}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-navy-mid/75">
              {counts.sent} sent · {counts.pending} pending · {counts.failed} failed
            </p>
            {result ? (
              <p className="mt-2 text-xs font-medium text-navy-mid">{result}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={pending}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong bg-white px-4 text-xs font-bold text-navy-mid transition hover:border-blue-vivid disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
          Retry queued emails
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/75 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <Icon className="size-4 text-navy-mid/70" />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function ApplicationCard({
  app,
  approveLabel,
  approveTo,
  reviewHref,
  reviewLabel,
}: {
  app: TalentApplication;
  approveLabel?: string;
  approveTo?: TalentStage;
  reviewHref?: string;
  reviewLabel?: string;
}) {
  const { onboarding, profile } = app;
  const [notes, setNotes] = useState(onboarding.admin_notes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const act = (nextStage: TalentStage) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await setTalentStage(
          onboarding.id,
          onboarding.stage,
          nextStage,
          notes || undefined
        );
        setMessage(
          result.email?.sent
            ? "Stage updated and email accepted for delivery."
            : result.email?.queued
              ? "Stage updated. The email is queued and will retry automatically."
              : "Stage updated."
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-white/85 p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold text-navy">
            {profile?.full_name ?? "Unnamed applicant"}
          </p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
          <p className="mt-1 text-sm text-navy-mid">
            {onboarding.headline ??
              optionLabel(TALENT_ROLES, onboarding.primary_role) ??
              "Applicant"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {onboarding.years_experience ? (
            <span className="rounded-full bg-blue-light/60 px-2.5 py-1 font-semibold text-navy-mid">
              {onboarding.years_experience}+ yrs
            </span>
          ) : null}
          {onboarding.country ? (
            <span className="rounded-full bg-blue-light/60 px-2.5 py-1 font-semibold text-navy-mid">
              {onboarding.country}
            </span>
          ) : null}
        </div>
      </div>

      {onboarding.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {onboarding.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border-strong bg-white px-2.5 py-0.5 text-xs font-medium text-navy-mid"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {onboarding.bio ? (
        <p className="mt-3 text-sm text-muted-foreground">{onboarding.bio}</p>
      ) : null}

      {onboarding.agri_experience ? (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-navy-mid">Agri context: </span>
          {onboarding.agri_experience}
        </p>
      ) : null}

      {(onboarding.portfolio_url || onboarding.github_url) ? (
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-blue-vivid">
          {onboarding.portfolio_url ? (
            <a
              href={onboarding.portfolio_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="size-3.5" /> Portfolio
            </a>
          ) : null}
          {onboarding.github_url ? (
            <a
              href={onboarding.github_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="size-3.5" /> GitHub
            </a>
          ) : null}
        </div>
      ) : null}

      {onboarding.assessment ? (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-surface/60 p-4">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-navy-mid/70">
            Assessment answers
          </p>
          {onboarding.assessment.problem_solving ? (
            <AssessmentAnswer label="Problem solving" value={onboarding.assessment.problem_solving} />
          ) : null}
          {onboarding.assessment.technical_build ? (
            <AssessmentAnswer label="Technical build" value={onboarding.assessment.technical_build} />
          ) : null}
          {onboarding.assessment.agri_context ? (
            <AssessmentAnswer label="Agri context" value={onboarding.assessment.agri_context} />
          ) : null}
        </div>
      ) : null}

      {reviewHref ? (
        <Link
          href={reviewHref}
          className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-navy-mid px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
        >
          <ClipboardCheck className="size-4" />
          {reviewLabel ?? "Open review"}
        </Link>
      ) : null}

      {reviewHref ? null : (
      <>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Reviewer notes (shared with applicant if rejected)…"
        className="mt-4 w-full rounded-xl border border-border-strong bg-white/60 px-3 py-2 text-sm text-navy placeholder-muted-foreground/50 transition focus:border-blue-vivid focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-vivid/10"
      />

      {error ? (
        <p className="mt-2 text-xs font-medium text-accent-amber">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-2 text-xs font-medium text-accent-teal">{message}</p>
      ) : null}

      {approveTo && approveLabel ? (
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => act(approveTo)}
          disabled={pending}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-navy-mid px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:opacity-50"
        >
          {approveTo === "approved" ? (
            <Trophy className="size-4" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {approveLabel}
        </button>
        <button
          type="button"
          onClick={() => act("rejected")}
          disabled={pending}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border-strong bg-white px-5 text-sm font-semibold text-muted-foreground transition hover:border-accent-amber/40 hover:text-accent-amber disabled:opacity-50"
        >
          <XCircle className="size-4" />
          Reject
        </button>
      </div>
      ) : null}
      </>
      )}
    </div>
  );
}

function AssessmentAnswer({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-navy-mid">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
