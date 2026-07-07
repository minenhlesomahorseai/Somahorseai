import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ClipboardX,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

import { isAdminUser } from "@/lib/auth/admin";
import type { Profile, TalentOnboarding } from "@/lib/auth/types";
import { fetchLatestAssessmentForTalent } from "@/lib/assessment/data";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";
import { createClient } from "@/lib/supabase/server";

import { AssessmentDecision } from "./decision";

export const metadata = { title: "Assessment review — Somahorse.ai" };

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  ready: { label: "Not started", tone: "text-muted-foreground" },
  in_progress: { label: "In progress", tone: "text-blue-vivid" },
  submitted: { label: "Submitted — grading pending", tone: "text-accent-amber" },
  graded: { label: "Graded", tone: "text-accent-teal" },
  disqualified: { label: "Disqualified", tone: "text-accent-amber" },
  error: { label: "Generation error", tone: "text-accent-amber" },
};

export default async function AssessmentReviewPage({
  params,
}: {
  params: Promise<{ talentId: string }>;
}) {
  const { talentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/admin/assessment/${talentId}`);
  if (!(await isAdminUser(supabase, user))) redirect("/");

  const { data: onboardingRow } = await supabase
    .from("talent_onboarding")
    .select(
      "id, stage, headline, primary_role, years_experience, skills, bio, agri_experience, portfolio_url, github_url, country, admin_notes"
    )
    .eq("id", talentId)
    .maybeSingle();
  const onboarding = onboardingRow as TalentOnboarding | null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, onboarding_status")
    .eq("id", talentId)
    .maybeSingle();
  const profile = profileRow as Profile | null;

  const assessment = await fetchLatestAssessmentForTalent(supabase, talentId);

  if (!onboarding) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Applicant not found.</p>
      </Shell>
    );
  }

  const status = assessment ? STATUS_COPY[assessment.status] : null;
  const decidable = onboarding.stage === "assessment_review";

  return (
    <Shell>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-mid hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to console
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {profile?.full_name ?? "Unnamed applicant"}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <p className="mt-1 text-sm text-navy-mid">
            {onboarding.headline ??
              optionLabel(TALENT_ROLES, onboarding.primary_role) ??
              "Applicant"}
            {onboarding.years_experience
              ? ` · ${onboarding.years_experience}+ yrs`
              : ""}
            {onboarding.country ? ` · ${onboarding.country}` : ""}
          </p>
        </div>
        {status ? (
          <span className={`text-sm font-bold ${status.tone}`}>{status.label}</span>
        ) : null}
      </div>

      {onboarding.skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {onboarding.skills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border-strong bg-white px-2.5 py-0.5 text-xs font-medium text-navy-mid"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      {(onboarding.portfolio_url || onboarding.github_url) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-blue-vivid">
          {onboarding.portfolio_url && (
            <a href={onboarding.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
              <ExternalLink className="size-3.5" /> Portfolio
            </a>
          )}
          {onboarding.github_url && (
            <a href={onboarding.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
              <ExternalLink className="size-3.5" /> GitHub
            </a>
          )}
        </div>
      )}

      {!assessment ? (
        <Panel className="mt-8 text-center text-sm text-muted-foreground">
          No assessment has been generated for this applicant yet.
        </Panel>
      ) : (
        <>
          {/* Score + flags summary */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI score
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-navy">
                {assessment.score != null && assessment.max_score
                  ? `${Math.round((assessment.score / assessment.max_score) * 100)}%`
                  : "—"}
              </p>
              {assessment.score != null && assessment.max_score ? (
                <p className="text-xs text-muted-foreground">
                  {assessment.score} / {assessment.max_score} points
                </p>
              ) : null}
              {assessment.recommendation ? (
                <span className="mt-2 inline-block rounded-full bg-blue-light px-2.5 py-0.5 text-xs font-bold capitalize text-navy-mid">
                  AI: {assessment.recommendation}
                </span>
              ) : null}
            </Panel>
            <Panel>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ClipboardX className="size-3.5" /> Paste attempts
              </p>
              <p className={`mt-1 font-display text-3xl font-bold ${assessment.paste_flags > 0 ? "text-accent-amber" : "text-navy"}`}>
                {assessment.paste_flags}
              </p>
              <p className="text-xs text-muted-foreground">Blocked paste attempts in answer boxes</p>
            </Panel>
            <Panel>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldAlert className="size-3.5" /> Window exits
              </p>
              <p className={`mt-1 font-display text-3xl font-bold ${assessment.tab_violations > 0 ? "text-accent-amber" : "text-navy"}`}>
                {assessment.tab_violations}
              </p>
              <p className="text-xs text-muted-foreground">
                {assessment.status === "disqualified" ? "Disqualified" : "of 3 allowed"}
              </p>
            </Panel>
          </div>

          {assessment.disqualified_reason ? (
            <Panel className="mt-4 border-accent-amber/30 bg-accent-amber/5">
              <p className="flex items-center gap-2 text-sm font-semibold text-accent-amber">
                <ShieldAlert className="size-4" /> {assessment.disqualified_reason}
              </p>
            </Panel>
          ) : null}

          {assessment.overall_feedback ? (
            <Panel className="mt-4">
              <p className="font-display text-sm font-bold text-navy-mid">
                How the AI graded this
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {assessment.overall_feedback}
              </p>
            </Panel>
          ) : null}

          {/* Per-question breakdown */}
          <h2 className="mt-8 font-display text-lg font-bold text-navy">
            Questions &amp; answers
          </h2>
          <div className="mt-4 space-y-4">
            {assessment.questions.map((q, i) => {
              const evalItem = assessment.evaluation?.find((e) => e.id === q.id);
              const answer = assessment.answers[q.id];
              const answerText = q.options
                ? q.options.find((o) => o.id === answer)?.text ?? "(no answer)"
                : answer || "(no answer)";
              return (
                <Panel key={q.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-navy-mid/70">
                      Q{i + 1} · {q.focus ?? q.type}
                    </p>
                    {evalItem ? (
                      <span className="rounded-full bg-blue-light px-2.5 py-0.5 text-xs font-bold text-navy-mid">
                        {evalItem.score}/{evalItem.max}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm font-medium text-navy">
                    {q.prompt}
                  </p>
                  {q.options ? (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li
                          key={o.id}
                          className={`text-sm ${o.id === answer ? "font-semibold text-navy" : "text-muted-foreground"}`}
                        >
                          {o.id === answer ? "● " : "○ "}
                          {o.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 rounded-lg bg-surface/60 p-3 text-sm">
                      <p className="text-xs font-semibold text-navy-mid">Answer</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {answerText}
                      </p>
                    </div>
                  )}
                  {evalItem ? (
                    <div className="mt-3 rounded-lg border border-border bg-white p-3">
                      <p className="text-xs font-bold text-navy-mid">
                        AI · {evalItem.verdict}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {evalItem.feedback}
                      </p>
                    </div>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {/* Decision */}
      {decidable ? (
        <AssessmentDecision
          talentId={talentId}
          initialNotes={onboarding.admin_notes ?? ""}
        />
      ) : (
        <Panel className="mt-8 text-sm text-muted-foreground">
          This applicant is at the <strong className="text-navy-mid">{onboarding.stage}</strong>{" "}
          stage — promote/reject is only available while they are in assessment review.
        </Panel>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background hero-field dotted-grid">
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-10">{children}</div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-white/85 p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
}
