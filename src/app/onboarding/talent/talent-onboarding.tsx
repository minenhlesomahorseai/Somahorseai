"use client";

import Link from "next/link";
import {
  Check,
  ClipboardCheck,
  Clock,
  FileCode2,
  Trophy,
  Video,
  XCircle,
} from "lucide-react";

import type {
  InterviewSchedulingData,
  TalentOnboarding as TalentOnboardingRecord,
  TalentStage,
} from "@/lib/auth/types";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding/onboarding-ui";
import { InterviewScheduler } from "@/components/onboarding/interview-scheduler";

import { TalentProfileFlow } from "./profile-flow";

export function TalentOnboarding({
  initial,
  firstName,
  assessmentToken,
  interview,
  googleCalendarUrl,
}: {
  initial: TalentOnboardingRecord;
  firstName: string | null;
  assessmentToken: string | null;
  interview: InterviewSchedulingData;
  googleCalendarUrl: string | null;
}) {
  if (initial.stage === "profile") {
    return <TalentProfileFlow initial={initial} firstName={firstName} />;
  }
  return (
    <TalentPipeline
      initial={initial}
      firstName={firstName}
      assessmentToken={assessmentToken}
      interview={interview}
      googleCalendarUrl={googleCalendarUrl}
    />
  );
}

const PIPELINE: { stage: TalentStage; label: string }[] = [
  { stage: "pending_review", label: "Application review" },
  { stage: "assessment", label: "Technical assessment" },
  { stage: "interview", label: "Interview" },
  { stage: "approved", label: "Certified" },
];

function pipelineIndex(stage: TalentStage): number {
  switch (stage) {
    case "pending_review":
      return 0;
    case "assessment":
    case "assessment_review":
      return 1;
    case "interview":
    case "interview_review":
      return 2;
    case "approved":
      return 3;
    default:
      return 0;
  }
}

function TalentPipeline({
  initial,
  firstName,
  assessmentToken,
  interview,
  googleCalendarUrl,
}: {
  initial: TalentOnboardingRecord;
  firstName: string | null;
  assessmentToken: string | null;
  interview: InterviewSchedulingData;
  googleCalendarUrl: string | null;
}) {
  const stage = initial.stage;
  const activeIndex = pipelineIndex(stage);

  return (
    <OnboardingShell eyebrow="Application status" accent="blue">
      <PipelineTracker activeIndex={activeIndex} rejected={stage === "rejected"} />
      <OnboardingCard>
        {stage === "pending_review" ? (
          <StatusScreen
            icon={Clock}
            tone="amber"
            title="Your application is under review"
            body="We've received your complete profile and experience. Our team is reviewing it now, and we'll email you as soon as there is a decision."
          />
        ) : null}

        {stage === "assessment" ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
              <FileCode2 className="size-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy">
              Your assessment is ready{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your application was approved. This private assessment is tailored
              to your experience and must be completed in one timed sitting.
            </p>
            {assessmentToken ? (
              <Link
                href={`/assessment/${assessmentToken}`}
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
              >
                Open technical assessment
              </Link>
            ) : (
              <p className="mx-auto mt-6 max-w-md rounded-xl border border-accent-amber/25 bg-accent-amber/10 px-4 py-3 text-sm font-medium text-accent-amber">
                Your assessment link is being prepared. Refresh shortly or use
                the private link in your approval email.
              </p>
            )}
          </div>
        ) : null}

        {stage === "assessment_review" ? (
          <StatusScreen
            icon={ClipboardCheck}
            tone="amber"
            title="Assessment received"
            body="Your answers are safely submitted and the review team can see them. We'll email you with the result and unlock interview scheduling if you pass."
          />
        ) : null}

        {stage === "interview" || stage === "interview_review" ? (
          <InterviewScheduler
            role="talent"
            talentId={initial.id}
            data={interview}
            googleCalendarUrl={googleCalendarUrl}
          />
        ) : null}

        {stage === "approved" ? (
          <StatusScreen
            icon={Trophy}
            tone="teal"
            title="Welcome to the network!"
            body="You've completed certification. Your experience and onboarding profile are ready in the talent dashboard."
            action={{ href: "/dashboard/talent", label: "Go to your dashboard" }}
          />
        ) : null}

        {stage === "rejected" ? (
          <StatusScreen
            icon={XCircle}
            tone="amber"
            title="Application not successful this time"
            body={
              initial.admin_notes ??
              "Thank you for your time. Unfortunately we're not moving forward right now, but you're welcome to apply again in the future."
            }
          />
        ) : null}
      </OnboardingCard>
    </OnboardingShell>
  );
}

function PipelineTracker({
  activeIndex,
  rejected,
}: {
  activeIndex: number;
  rejected: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
      {PIPELINE.map((item, index) => {
        const done = index < activeIndex || (activeIndex === 3 && index <= 3);
        const active = index === activeIndex && !rejected;
        return (
          <div key={item.stage} className="flex items-center gap-2">
            <span
              className={`flex size-7 items-center justify-center rounded-full border text-xs font-bold ${
                done
                  ? "border-accent-teal bg-accent-teal text-white"
                  : active
                    ? "border-navy-mid bg-navy-mid text-white shadow-glow"
                    : "border-border-strong bg-white/70 text-muted-foreground"
              }`}
            >
              {done ? <Check className="size-3.5 stroke-[3]" /> : index + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                active ? "text-navy" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
            {index < PIPELINE.length - 1 ? (
              <span className="mx-1 hidden h-0.5 w-6 rounded-full bg-border sm:block" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StatusScreen({
  icon: Icon,
  title,
  body,
  tone,
  action,
}: {
  icon: typeof Clock | typeof Video;
  title: string;
  body: string;
  tone: "amber" | "teal";
  action?: { href: string; label: string };
}) {
  const toneClass =
    tone === "teal"
      ? "bg-accent-teal/15 text-accent-teal"
      : "bg-accent-amber/15 text-accent-amber";
  return (
    <div className="py-6 text-center">
      <div
        className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-full ${toneClass}`}
      >
        <Icon className="size-7" />
      </div>
      <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
        >
          {action.label}
        </Link>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          You can safely close this page — your progress is saved.
        </p>
      )}
    </div>
  );
}
