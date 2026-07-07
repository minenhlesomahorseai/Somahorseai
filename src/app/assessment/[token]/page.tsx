import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchAssessmentByToken } from "@/lib/assessment/data";
import { createClient } from "@/lib/supabase/server";

import { AssessmentRunner } from "./assessment-runner";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/assessment/${token}`);
  }

  const assessment = await fetchAssessmentByToken(supabase, token);

  if (!assessment || assessment.talent_id !== user.id) {
    return (
      <Shell>
        <StatusCard
          title="Assessment not found"
          body="This assessment link is invalid, or it belongs to a different account. Check that you're signed in with the email you applied with."
        />
      </Shell>
    );
  }

  if (assessment.status === "disqualified") {
    return (
      <Shell>
        <StatusCard
          tone="warn"
          title="This assessment was closed"
          body="Your assessment session was ended due to a policy violation. Our team has been notified and will be in touch about next steps."
        />
      </Shell>
    );
  }

  if (assessment.status === "submitted" || assessment.status === "graded") {
    return (
      <Shell>
        <StatusCard
          tone="done"
          title="Thank you — your assessment is in"
          body="We've received your answers and our team is reviewing them. You'll hear from us by email with the outcome. You can close this tab."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <AssessmentRunner
        token={token}
        questions={assessment.questions}
        timeLimitSeconds={assessment.time_limit_seconds}
        resuming={assessment.status === "in_progress"}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-blue-mist text-navy">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-12">{children}</div>
    </div>
  );
}

function StatusCard({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "done" | "warn";
}) {
  const accent =
    tone === "done"
      ? "text-accent-teal"
      : tone === "warn"
        ? "text-accent-amber"
        : "text-navy-mid";
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-border-strong bg-white p-8 text-center shadow-sm">
      <h1 className={`font-display text-2xl font-bold ${accent}`}>{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link
        href="/onboarding/talent"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-navy-mid px-6 text-sm font-bold text-white transition hover:bg-navy"
      >
        Back to your application
      </Link>
    </div>
  );
}
