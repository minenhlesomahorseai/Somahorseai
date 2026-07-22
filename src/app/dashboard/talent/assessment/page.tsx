import Link from "next/link";
import { ArrowUpRight, BadgeCheck, CheckCircle2, Clock3, FileText, ShieldCheck, Sparkles } from "lucide-react";

import { TalentEmptyState, TalentGlassCard, TalentPageHeader, TalentSectionTitle } from "@/components/dashboard/talent-ui";
import { fetchLatestAssessmentForTalent, timeLimitMinutes } from "@/lib/assessment/data";
import { loadTalentSession } from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/server";

export default async function TalentAssessmentPage() {
  const { userId, talent } = await loadTalentSession();
  const supabase = await createClient();
  const assessment = await fetchLatestAssessmentForTalent(supabase, userId);
  const score =
    assessment?.score != null && assessment.max_score
      ? Math.round((assessment.score / assessment.max_score) * 100)
      : null;

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Certification"
        title="Technical assessment"
        description="Your tailored assessment status, verified score, and certification feedback."
        action={
          assessment ? (
            <span className={`rounded-full px-3.5 py-2 text-xs font-bold capitalize ${statusTone(assessment.status)}`}>
              {assessment.status.replaceAll("_", " ")}
            </span>
          ) : null
        }
      />

      {!assessment ? (
        <TalentEmptyState
          icon={FileText}
          title="Your assessment is not ready yet"
          description={
            talent.stage === "pending_review"
              ? "Your profile is currently under review. If selected, a tailored technical assessment will appear here."
              : "The certification team will publish your tailored assessment here when it is ready."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <section className="talent-glass-dark relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 lg:col-span-5">
            <div className="absolute -right-16 -top-16 size-56 rounded-full bg-blue-vivid/25 blur-2xl" />
            <div className="relative flex h-full min-h-72 flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <BadgeCheck className="size-3.5" aria-hidden /> Certification record
                </span>
                <ShieldCheck className="size-6 text-accent-teal" aria-hidden />
              </div>
              {score != null ? (
                <div>
                  <p className="font-display text-6xl font-bold">{score}<span className="text-2xl text-white/45">%</span></p>
                  <p className="mt-2 text-sm text-white/65">Verified technical score</p>
                </div>
              ) : (
                <div>
                  <p className="font-display text-3xl font-bold capitalize">{assessment.status.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-sm text-white/65">Your score will appear here after grading.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/75">
                  <Clock3 className="size-3.5" aria-hidden /> {timeLimitMinutes(assessment)} minutes
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/75">{assessment.questions.length} questions</span>
              </div>
            </div>
          </section>

          <TalentGlassCard className="lg:col-span-7">
            <TalentSectionTitle title="Assessment status" icon={Sparkles} />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Generated", true],
                ["Submitted", ["submitted", "graded"].includes(assessment.status)],
                ["Graded", assessment.status === "graded"],
              ].map(([label, done]) => (
                <div key={String(label)} className="rounded-2xl bg-white/50 p-4">
                  {done ? <CheckCircle2 className="size-5 text-accent-teal" aria-hidden /> : <Clock3 className="size-5 text-blue-vivid/35" aria-hidden />}
                  <p className="mt-3 text-xs font-bold text-navy">{label}</p>
                </div>
              ))}
            </div>

            {assessment.status === "ready" || assessment.status === "in_progress" ? (
              <div className="mt-5 rounded-2xl border border-blue-vivid/15 bg-blue-vivid/8 p-4 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-navy">{assessment.status === "ready" ? "Ready when you are" : "Continue your assessment"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Use the secure assessment workspace to complete your test.</p>
                </div>
                <Link href={`/assessment/${assessment.token}`} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-glow sm:mt-0">
                  {assessment.status === "ready" ? "Start" : "Continue"} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            ) : null}

            {assessment.overall_feedback ? (
              <div className="mt-5 rounded-2xl bg-white/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-vivid">Overall feedback</p>
                <p className="mt-2 text-sm leading-6 text-navy-mid">{assessment.overall_feedback}</p>
              </div>
            ) : null}
          </TalentGlassCard>

          {assessment.evaluation?.length ? (
            <TalentGlassCard className="lg:col-span-12">
              <TalentSectionTitle title="Skill breakdown" icon={FileText} />
              <div className="grid gap-3 md:grid-cols-2">
                {assessment.evaluation.map((item, index) => {
                  const percentage = item.max ? Math.round((item.score / item.max) * 100) : 0;
                  return (
                    <div key={item.id} className="rounded-2xl bg-white/48 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-navy">Question {index + 1} · {item.verdict}</p>
                        <p className="text-xs font-bold text-blue-vivid">{item.score}/{item.max}</p>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-light">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-vivid to-accent-teal" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.feedback}</p>
                    </div>
                  );
                })}
              </div>
            </TalentGlassCard>
          ) : null}
        </div>
      )}
    </div>
  );
}

function statusTone(status: string) {
  if (status === "graded") return "bg-accent-teal/12 text-accent-teal";
  if (status === "disqualified" || status === "error") return "bg-accent-amber/15 text-accent-amber";
  return "bg-blue-vivid/10 text-blue-vivid";
}
