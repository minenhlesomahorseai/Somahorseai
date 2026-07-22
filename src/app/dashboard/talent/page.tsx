import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Code2,
  FolderKanban,
  MapPin,
  MailQuestion,
  Sparkles,
  Sprout,
  UserRound,
} from "lucide-react";

import {
  TalentGlassCard,
  TalentPageHeader,
  TalentSectionTitle,
} from "@/components/dashboard/talent-ui";
import type { TalentStage } from "@/lib/auth/types";
import { fetchLatestAssessmentForTalent } from "@/lib/assessment/data";
import {
  fetchTalentInvitations,
  fetchTalentProjects,
  loadTalentSession,
  talentProfileCompletion,
  type TalentNotification,
} from "@/lib/dashboard/talent";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";
import { createClient } from "@/lib/supabase/server";

import { setTalentAvailability } from "./actions";

const STAGE_COPY: Record<TalentStage, { label: string; detail: string; step: number; tone: string }> = {
  profile: {
    label: "Build your profile",
    detail: "Complete the essentials to enter review.",
    step: 0,
    tone: "bg-blue-light text-navy-mid",
  },
  pending_review: {
    label: "Profile in review",
    detail: "The talent team is reviewing your experience.",
    step: 1,
    tone: "bg-accent-amber/15 text-accent-amber",
  },
  assessment: {
    label: "Assessment ready",
    detail: "Your tailored technical assessment is waiting.",
    step: 2,
    tone: "bg-blue-vivid/12 text-blue-vivid",
  },
  assessment_review: {
    label: "Assessment in review",
    detail: "Your submission is with the certification team.",
    step: 3,
    tone: "bg-accent-amber/15 text-accent-amber",
  },
  interview: {
    label: "Interview stage",
    detail: "You cleared technical review. Interview details follow.",
    step: 4,
    tone: "bg-blue-vivid/12 text-blue-vivid",
  },
  interview_review: {
    label: "Final review",
    detail: "The team is completing your network decision.",
    step: 4,
    tone: "bg-accent-amber/15 text-accent-amber",
  },
  approved: {
    label: "Certified talent",
    detail: "You are ready to match with funded projects.",
    step: 5,
    tone: "bg-accent-teal/12 text-accent-teal",
  },
  rejected: {
    label: "Application complete",
    detail: "Your application journey has concluded.",
    step: 5,
    tone: "bg-navy/10 text-navy",
  },
};

const JOURNEY = ["Profile", "Review", "Test", "Certified", "Interview", "Network"];

export default async function TalentDashboardPage() {
  const { userId, user, talent } = await loadTalentSession();
  const supabase = await createClient();
  const [assessment, projects, invitations, activityResult] = await Promise.all([
    fetchLatestAssessmentForTalent(supabase, userId),
    fetchTalentProjects(supabase),
    fetchTalentInvitations(supabase, userId),
    supabase
      .from("notifications")
      .select("id, type, title, message, read_at, created_at")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const role = optionLabel(TALENT_ROLES, talent.primary_role) ?? "Independent technologist";
  const stage = STAGE_COPY[talent.stage];
  const completion = talentProfileCompletion(talent);
  const completionPercent = Math.round((completion / 7) * 100);
  const assessmentScore =
    assessment?.score != null && assessment.max_score
      ? Math.round((assessment.score / assessment.max_score) * 100)
      : null;
  const activeProjects = projects.filter((project) => ["assigned", "active"].includes(project.assignment_status));
  const hasActiveProject = activeProjects.length > 0;
  const isApproved = talent.stage === "approved";
  const activities = (activityResult.data ?? []) as TalentNotification[];
  const profileTasks = [
    { label: "Role and experience", done: Boolean(talent.primary_role && talent.years_experience) },
    { label: "Core skills", done: talent.skills.length > 0 },
    { label: "Headline and bio", done: Boolean(talent.headline && talent.bio) },
    { label: "Portfolio or GitHub", done: Boolean(talent.portfolio_url || talent.github_url) },
  ];

  return (
    <div className="space-y-6">
      <TalentPageHeader
        eyebrow="Talent dashboard"
        title={`Good ${getTimeGreeting()}${user.firstName ? `, ${user.firstName}` : ""}`}
        description="Your projects, invitations, certification, and profile momentum — all in one place."
        action={
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MiniStat value={String(invitations.length)} label="Invites" icon={MailQuestion} />
            <MiniStat value={String(activeProjects.length)} label="Active" icon={FolderKanban} />
            <MiniStat value={`${completionPercent}%`} label="Profile" icon={UserRound} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="talent-glass-dark talent-card-enter relative min-h-[20rem] overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 lg:col-span-7">
          <div className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full border border-white/10 bg-white/5" />
          <div className="pointer-events-none absolute -bottom-28 right-24 size-64 rounded-full border border-accent-teal/20 bg-accent-teal/5" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-xl">
                <span className={`size-2 rounded-full ${isApproved ? "talent-live-dot bg-accent-teal" : "bg-accent-amber"}`} />
                {stage.label}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10 font-display text-base font-bold backdrop-blur-xl">
                {user.initials}
              </span>
            </div>

            <div className="mt-12 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Your professional card</p>
              <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
                {user.fullName ?? "Your talent profile"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/68">{talent.headline ?? role}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                  <Code2 className="size-3.5" aria-hidden /> {role}
                </span>
                {talent.country ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                    <MapPin className="size-3.5" aria-hidden /> {talent.country}
                  </span>
                ) : null}
                {talent.years_experience ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                    <BriefcaseBusiness className="size-3.5" aria-hidden /> {talent.years_experience}+ years
                  </span>
                ) : null}
              </div>
              <Link
                href="/dashboard/talent/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-navy shadow-soft transition hover:scale-[1.02] hover:bg-blue-mist"
              >
                Open profile <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <TalentGlassCard className="talent-card-enter flex flex-col lg:col-span-5">
          <TalentSectionTitle title="Network readiness" icon={Sparkles} />
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-4xl font-bold text-navy">{completionPercent}%</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Profile signal strength</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${stage.tone}`}>{stage.label}</span>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-blue-light/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-vivid to-accent-teal transition-[width] duration-700"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{stage.detail}</p>
            </div>

            {isApproved ? (
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-accent-teal/15 bg-accent-teal/8 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="talent-live-dot size-2.5 rounded-full bg-accent-teal" />
                  <div>
                    <p className="text-xs font-bold text-navy">
                      {hasActiveProject
                        ? "Committed to a project"
                        : talent.availability_status === "available"
                          ? "Visible to matching"
                          : "Matching paused"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Availability updates instantly</p>
                  </div>
                </div>
                {!hasActiveProject ? (
                  <form action={setTalentAvailability}>
                    <input
                      type="hidden"
                      name="availability"
                      value={talent.availability_status === "available" ? "unavailable" : "available"}
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-border bg-white/80 px-3 py-2 text-[11px] font-bold text-navy-mid transition hover:bg-white"
                    >
                      {talent.availability_status === "available" ? "Pause" : "Go available"}
                    </button>
                  </form>
                ) : null}
              </div>
            ) : (
              <Link
                href="/dashboard/talent/assessment"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-bold text-white shadow-glow"
              >
                View certification path <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </TalentGlassCard>

        <TalentGlassCard className="talent-card-enter lg:col-span-8">
          <TalentSectionTitle title="Certification journey" icon={ClipboardCheck} href="/dashboard/talent/assessment" />
          <div className="mt-6 flex items-start">
            {JOURNEY.map((item, index) => (
              <div key={item} className="relative flex flex-1 flex-col items-center text-center">
                {index < JOURNEY.length - 1 ? (
                  <span className={`absolute left-1/2 top-2.5 h-0.5 w-full ${index < stage.step ? "bg-accent-teal" : "bg-blue-light"}`} />
                ) : null}
                <span
                  className={`relative z-10 grid size-5 place-items-center rounded-full border-2 ${
                    index <= stage.step ? "border-accent-teal bg-accent-teal" : "border-blue-light bg-white"
                  }`}
                >
                  {index < stage.step ? <CheckCircle2 className="size-3 text-white" aria-hidden /> : null}
                </span>
                <span className="mt-2.5 max-w-16 text-[9px] font-semibold leading-tight text-muted-foreground sm:text-[11px]">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white/55 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-navy">{stage.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stage.detail}</p>
            </div>
            <p className="font-display text-2xl font-bold text-navy">{stage.step + 1}<span className="text-sm text-muted-foreground">/6</span></p>
          </div>
        </TalentGlassCard>

        <TalentGlassCard className="talent-card-enter lg:col-span-4">
          <TalentSectionTitle title="Assessment" icon={BadgeCheck} href="/dashboard/talent/assessment" />
          {assessmentScore != null ? (
            <div className="flex items-center gap-5">
              <div
                className="grid size-24 shrink-0 place-items-center rounded-full p-2"
                style={{ background: `conic-gradient(hsl(var(--accent-teal)) ${assessmentScore}%, hsl(var(--blue-light)) 0)` }}
              >
                <div className="grid size-full place-items-center rounded-full bg-white/90">
                  <span className="font-display text-2xl font-bold text-navy">{assessmentScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Technical score</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Stored in your certification record and used for matching.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-sm font-bold text-navy">{assessment ? "Assessment in progress" : "Not scored yet"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {assessment ? "Open your assessment page for the latest status." : "Your tailored test appears after profile review."}
              </p>
            </div>
          )}
        </TalentGlassCard>

        <TalentGlassCard className="talent-card-enter lg:col-span-7">
          <TalentSectionTitle title="Current work" icon={FolderKanban} href="/dashboard/talent/projects" />
          {activeProjects.length ? (
            <div className="space-y-2.5">
              {activeProjects.slice(0, 2).map((project) => (
                <div key={project.project_id} className="rounded-2xl border border-white/75 bg-white/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/dashboard/talent/projects/${project.project_id}`} className="inline-flex max-w-full items-center gap-1.5 font-display text-base font-bold text-navy transition hover:text-blue-vivid">
                        <span className="truncate">{project.title}</span><ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                      </Link>
                      <p className="mt-0.5 text-xs font-semibold text-blue-vivid">{project.assignment_role}</p>
                    </div>
                    <span className="rounded-full bg-accent-teal/10 px-2.5 py-1 text-[10px] font-bold capitalize text-accent-teal">
                      {project.assignment_status}
                    </span>
                  </div>
                  {project.summary ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.summary}</p> : null}
                  {project.timeline_weeks ? (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-light/65 px-2.5 py-1 text-[11px] font-semibold text-navy-mid">
                      <CalendarClock className="size-3" aria-hidden /> {project.timeline_weeks} week delivery
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start rounded-2xl border border-dashed border-blue-vivid/20 bg-white/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-navy">No active project yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {isApproved ? "You are ready for matching. New funded opportunities will appear in Invites." : "Complete certification to enter the project matching network."}
                </p>
              </div>
              <Link href="/dashboard/talent/invites" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-vivid sm:mt-0">
                View invites <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          )}
        </TalentGlassCard>

        <TalentGlassCard className="talent-card-enter flex flex-col lg:col-span-5">
          <TalentSectionTitle title="Profile checklist" icon={UserRound} href="/dashboard/talent/profile" linkLabel="Improve" />
          <ul className="flex-1 space-y-3">
            {profileTasks.map((task) => (
              <li key={task.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/45 px-3 py-2.5">
                <span className={`text-xs font-semibold ${task.done ? "text-muted-foreground line-through" : "text-navy"}`}>{task.label}</span>
                {task.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-accent-teal" aria-hidden />
                ) : (
                  <Circle className="size-4 shrink-0 text-blue-vivid/35" aria-hidden />
                )}
              </li>
            ))}
          </ul>
        </TalentGlassCard>

        <TalentGlassCard className="talent-card-enter lg:col-span-7">
          <TalentSectionTitle title="Your strongest signals" icon={Code2} href="/dashboard/talent/profile" linkLabel="Edit profile" />
          {talent.skills.length ? (
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-xs font-semibold text-navy-mid shadow-soft">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add your strongest skills so the Matching Agent can understand your fit.</p>
          )}
          {talent.agri_experience ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-accent-teal/8 p-3.5">
              <Sprout className="mt-0.5 size-4 shrink-0 text-accent-teal" aria-hidden />
              <p className="text-xs leading-5 text-navy-mid"><strong>Agricultural context:</strong> {talent.agri_experience}</p>
            </div>
          ) : null}
        </TalentGlassCard>

        <TalentGlassCard className="talent-card-enter lg:col-span-5">
          <TalentSectionTitle title="Recent activity" icon={Sparkles} />
          {activities.length ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-vivid" />
                  <div>
                    <p className="text-xs font-bold text-navy">{activity.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{activity.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/45 p-4">
              <p className="text-sm font-bold text-navy">All quiet for now</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Invites, certification changes, and project updates will show here.</p>
            </div>
          )}
        </TalentGlassCard>
      </div>
    </div>
  );
}

function MiniStat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof MailQuestion }) {
  return (
    <div className="talent-glass flex min-w-0 items-center gap-2 rounded-2xl px-2.5 py-2.5 sm:min-w-24 sm:px-3">
      <span className="hidden size-8 shrink-0 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid sm:grid">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-none text-navy sm:text-xl">{value}</p>
        <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">{label}</p>
      </div>
    </div>
  );
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
