import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { InterviewScheduler } from "@/components/onboarding/interview-scheduler";
import { isAdminUser } from "@/lib/auth/admin";
import { googleCalendarUrl } from "@/lib/interviews/calendar";
import {
  confirmedInterviewProposal,
  fetchInterviewScheduling,
} from "@/lib/interviews/data";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Interview scheduling — Somahorse.ai" };

export default async function AdminInterviewPage({
  params,
}: {
  params: Promise<{ talentId: string }>;
}) {
  const { talentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/interviews/${talentId}`);
  if (!(await isAdminUser(supabase, user))) redirect("/");

  const [{ data: profile }, { data: onboarding }, interview] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", talentId)
      .maybeSingle(),
    supabase
      .from("talent_onboarding")
      .select("id, stage, headline, primary_role, years_experience, skills")
      .eq("id", talentId)
      .maybeSingle(),
    fetchInterviewScheduling(supabase, talentId),
  ]);

  if (!profile || !onboarding) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-navy">
            Applicant not found
          </h1>
          <Link
            href="/admin"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-mid hover:underline"
          >
            <ArrowLeft className="size-4" /> Back to certification console
          </Link>
        </div>
      </AdminShell>
    );
  }

  const confirmed = confirmedInterviewProposal(interview);
  const calendarUrl =
    confirmed && interview.schedule
      ? googleCalendarUrl({
          startsAt: confirmed.starts_at,
          endsAt: confirmed.ends_at,
          talentName: profile.full_name,
          dashboardUrl: siteUrl(`/admin/interviews/${talentId}`),
          meetingUrl: interview.schedule.meeting_url,
        })
      : null;

  return (
    <AdminShell>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-mid transition hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Certification console
      </Link>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-white/80 p-5 shadow-soft">
          <div className="flex size-11 items-center justify-center rounded-full bg-blue-light text-navy-mid">
            <UserRound className="size-5" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-navy">
            {profile.full_name ?? "Unnamed candidate"}
          </h1>
          <p className="mt-1 text-sm text-navy-mid">
            {onboarding.headline ?? onboarding.primary_role ?? "Talent applicant"}
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3.5" /> {profile.email ?? "No email address"}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" /> Stage:{" "}
            <span className="font-semibold capitalize">
              {String(onboarding.stage).replace(/_/g, " ")}
            </span>
          </p>
          {onboarding.years_experience ? (
            <p className="mt-4 text-xs font-semibold text-navy-mid">
              {onboarding.years_experience}+ years experience
            </p>
          ) : null}
          {Array.isArray(onboarding.skills) && onboarding.skills.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {onboarding.skills.slice(0, 8).map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-navy-mid"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </aside>

        <section className="rounded-2xl border border-border bg-white/85 p-5 shadow-card sm:p-7">
          <InterviewScheduler
            role="admin"
            talentId={talentId}
            talentName={profile.full_name}
            data={interview}
            googleCalendarUrl={calendarUrl}
          />
        </section>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dotted-grid">
      <header className="border-b border-border/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/somahorse-logo.png"
              alt="Somahorse.ai"
              width={32}
              height={32}
              className="size-8 rounded-full object-contain"
            />
            <span className="font-display text-base font-bold text-navy">
              Somahorse<span className="text-blue-vivid">.ai</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

