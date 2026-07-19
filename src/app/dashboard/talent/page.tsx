import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Code2,
  ExternalLink,
  FileText,
  GitFork,
  Globe2,
  MapPin,
  Sparkles,
  Sprout,
  UserRound,
} from "lucide-react";

import { StatBadge, Tile, TileHeader } from "@/components/dashboard/ui";
import { fetchProfile } from "@/lib/auth/profile";
import type { TalentStage } from "@/lib/auth/types";
import { fetchLatestAssessmentForTalent } from "@/lib/assessment/data";
import { optionLabel, TALENT_ROLES } from "@/lib/onboarding/options";
import { fetchTalentOnboarding } from "@/lib/onboarding/data";
import { createClient } from "@/lib/supabase/server";

const STAGE_COPY: Record<
  TalentStage,
  { label: string; detail: string; step: number; tone: string }
> = {
  profile: {
    label: "Complete your profile",
    detail: "Add the details our team needs to start your review.",
    step: 0,
    tone: "bg-blue-light text-navy-mid",
  },
  pending_review: {
    label: "Profile under review",
    detail: "Our team is reviewing your experience and strengths.",
    step: 1,
    tone: "bg-accent-amber/15 text-accent-amber",
  },
  assessment: {
    label: "Assessment ready",
    detail: "Your technical assessment is ready. Check your email for the secure link.",
    step: 2,
    tone: "bg-blue-vivid/12 text-blue-vivid",
  },
  assessment_review: {
    label: "Assessment under review",
    detail: "Your assessment is with the certification team.",
    step: 3,
    tone: "bg-accent-amber/15 text-accent-amber",
  },
  interview: {
    label: "Interview stage",
    detail: "You have cleared the technical review. Our team will be in touch about an interview.",
    step: 4,
    tone: "bg-blue-vivid/12 text-blue-vivid",
  },
  interview_review: {
    label: "Final review",
    detail: "We are completing the final review of your application.",
    step: 4,
    tone: "bg-accent-amber/15 text-accent-amber",
  },
  approved: {
    label: "Certified talent",
    detail: "You are approved for the Somahorse.ai talent network.",
    step: 5,
    tone: "bg-accent-teal/12 text-accent-teal",
  },
  rejected: {
    label: "Application update",
    detail: "Your application is now complete. Thank you for sharing your work with us.",
    step: 5,
    tone: "bg-navy/10 text-navy",
  },
};

const JOURNEY = ["Profile", "Review", "Assessment", "Certification", "Interview", "Network"];

function profileCompletion(data: {
  headline: string | null;
  primary_role: string | null;
  years_experience: number | null;
  skills: string[];
  bio: string | null;
  country: string | null;
  portfolio_url: string | null;
  github_url: string | null;
}) {
  return [
    data.primary_role,
    data.years_experience,
    data.skills.length > 0,
    data.headline,
    data.bio,
    data.country,
    data.portfolio_url || data.github_url,
  ].filter(Boolean).length;
}

export default async function TalentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await fetchProfile(supabase, user.id);
  if (!profile || profile.role !== "talent") redirect("/onboarding/talent");

  const [talent, assessment] = await Promise.all([
    fetchTalentOnboarding(supabase, user.id),
    fetchLatestAssessmentForTalent(supabase, user.id),
  ]);

  if (!talent) redirect("/onboarding/talent");

  const firstName = profile.full_name?.trim().split(/\s+/)[0];
  const role = optionLabel(TALENT_ROLES, talent.primary_role) ?? "Independent technologist";
  const status = STAGE_COPY[talent.stage];
  const completion = profileCompletion(talent);
  const assessmentScore =
    assessment?.score != null && assessment.max_score
      ? Math.round((assessment.score / assessment.max_score) * 100)
      : null;
  const isApproved = talent.stage === "approved";
  const portfolioLinks = [
    { label: "Portfolio", href: talent.portfolio_url, icon: Globe2 },
    { label: "GitHub", href: talent.github_url, icon: GitFork },
  ].filter((link): link is { label: string; href: string; icon: typeof Globe2 } => Boolean(link.href));

  const profileTasks = [
    { label: "Add your role and experience", done: Boolean(talent.primary_role && talent.years_experience) },
    { label: "Choose your strongest skills", done: talent.skills.length > 0 },
    { label: "Tell us about your work", done: Boolean(talent.headline && talent.bio) },
    { label: "Share a portfolio or GitHub", done: Boolean(talent.portfolio_url || talent.github_url) },
  ];

  return (
    <main className="min-h-screen bg-background hero-field px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="cue text-navy-mid/70">Talent dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Welcome{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Your profile, certification journey, and network readiness in one place.
            </p>
          </div>
          <div className="flex items-center gap-6 sm:gap-9">
            <StatBadge value={String(talent.skills.length)} label="Skills" icon={Code2} />
            <StatBadge
              value={talent.years_experience ? `${talent.years_experience}+` : "—"}
              label="Years exp."
              icon={BriefcaseBusiness}
            />
            <StatBadge value={`${completion}/7`} label="Profile" icon={UserRound} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Tile className="lg:col-span-4 lg:row-span-2 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-navy via-navy-mid to-blue-vivid p-0 text-white">
            <div className="relative flex h-full flex-col justify-between p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <BadgeCheck className="size-3.5" aria-hidden /> {isApproved ? "Certified" : "Talent profile"}
                </span>
                <span className="grid size-12 place-items-center rounded-2xl bg-white/15 font-display text-lg font-bold backdrop-blur">
                  {(profile.full_name ?? profile.email ?? "SA")
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div className="mt-10">
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {profile.full_name ?? "Your talent profile"}
                </h2>
                <p className="mt-1 text-sm text-white/70">{talent.headline ?? role}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <Code2 className="size-3" aria-hidden /> {role}
                  </span>
                  {talent.country ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                      <MapPin className="size-3" aria-hidden /> {talent.country}
                    </span>
                  ) : null}
                </div>
                <Link
                  href="/onboarding/talent"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-blue-mist"
                >
                  View profile <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </Tile>

          <Tile className="lg:col-span-5">
            <TileHeader title="Application journey" icon={ClipboardCheck} />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}>
                  {status.label}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">{status.detail}</p>
              </div>
              <p className="font-display text-3xl font-bold text-navy">{status.step + 1}/6</p>
            </div>
            <div className="mt-5 flex items-start">
              {JOURNEY.map((step, index) => (
                <div key={step} className="relative flex flex-1 flex-col items-center text-center">
                  {index < JOURNEY.length - 1 ? (
                    <span className={`absolute left-1/2 top-2 h-0.5 w-full ${index < status.step ? "bg-accent-teal" : "bg-border"}`} />
                  ) : null}
                  <span className={`relative z-10 size-4 rounded-full border-2 ${index <= status.step ? "border-accent-teal bg-accent-teal" : "border-border-strong bg-white"}`} />
                  <span className="mt-2 text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">{step}</span>
                </div>
              ))}
            </div>
          </Tile>

          <Tile className="lg:col-span-3 flex flex-col justify-between">
            <TileHeader title="Certification" icon={Sparkles} />
            {assessmentScore != null ? (
              <>
                <div>
                  <p className="font-display text-4xl font-bold text-navy">{assessmentScore}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">Latest assessment score</p>
                </div>
                <p className="mt-4 rounded-2xl bg-accent-teal/10 p-3 text-xs text-accent-teal">
                  Your assessment has been scored and is part of your certification record.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {talent.stage === "assessment"
                    ? "Your tailored technical assessment is ready to complete."
                    : "Your tailored technical assessment will be shared once your profile review is complete."}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-mid">
                  <FileText className="size-4" aria-hidden /> Assessment status
                </span>
              </>
            )}
          </Tile>

          <Tile className="lg:col-span-5">
            <TileHeader title="Your strengths" icon={Code2} />
            {talent.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-blue-light/70 px-3 py-1.5 text-xs font-semibold text-navy-mid">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add your strongest skills to help the Matching Agent understand your fit.</p>
            )}
            {talent.agri_experience ? (
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-accent-teal/8 p-3 text-xs text-navy-mid">
                <Sprout className="mt-0.5 size-3.5 shrink-0 text-accent-teal" aria-hidden />
                <span><strong className="font-semibold">Agricultural context:</strong> {talent.agri_experience}</span>
              </p>
            ) : null}
          </Tile>

          <Tile className="lg:col-span-3 lg:row-span-2 flex flex-col bg-navy text-white">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Profile readiness</h3>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">{profileTasks.filter((task) => task.done).length}/{profileTasks.length}</span>
            </div>
            <ul className="flex-1 space-y-3">
              {profileTasks.map((task) => (
                <li key={task.label} className="flex items-start gap-2.5 text-sm">
                  {task.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-teal" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden />}
                  <span className={task.done ? "text-white/50 line-through" : "text-white/90"}>{task.label}</span>
                </li>
              ))}
            </ul>
            <Link href="/onboarding/talent" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-blue-mist">
              Update profile <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </Tile>

          <Tile className="lg:col-span-9">
            <TileHeader title="Work and profile details" icon={UserRound} />
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div>
                <p className="text-sm font-semibold text-navy">{role}{talent.years_experience ? ` · ${talent.years_experience}+ years experience` : ""}</p>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{talent.bio ?? "Add a short bio to give the team more context on your experience and the work you do best."}</p>
              </div>
              {portfolioLinks.length ? (
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {portfolioLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-white px-3.5 py-2 text-xs font-semibold text-navy-mid transition hover:bg-blue-mist">
                        <Icon className="size-3.5" aria-hidden /> {link.label} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Tile>
        </div>
      </div>
    </main>
  );
}
