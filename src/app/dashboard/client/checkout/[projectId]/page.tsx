import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { loadClientSession } from "@/lib/dashboard/session";
import {
  paddleClientToken,
  publicPaddleEnvironment,
} from "@/lib/payments/paddle";
import { formatZar } from "@/lib/projects/pricing";
import type { ProjectProposal } from "@/lib/projects/types";
import { createClient } from "@/lib/supabase/server";

import { PaddleCheckout } from "./paddle-checkout";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { userId, user } = await loadClientSession();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, summary, status, proposal, timeline_weeks, build_fee_amount, deposit_amount, monthly_fee_amount, payment_status, paddle_transaction_id, matched_team"
    )
    .eq("id", projectId)
    .eq("client_id", userId)
    .maybeSingle();

  if (!project) notFound();
  if (project.payment_status === "paid") {
    redirect(`/dashboard/client/projects?started=${project.id}`);
  }

  const token = paddleClientToken();
  const proposal = project.proposal as ProjectProposal | null;

  return (
    <main className="intake-field min-h-screen px-4 py-6 text-navy sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard/client/new-project"
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy-mid transition hover:text-blue-vivid"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to proposal
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:items-start">
          <section className="intake-glass rounded-[2rem] p-5 shadow-card sm:p-7 lg:sticky lg:top-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-accent-teal">
              <ShieldCheck className="size-3.5" /> Secure project start
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy">
              {project.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {project.summary ?? proposal?.summary}
            </p>

            <div className="mt-6 rounded-3xl bg-navy p-5 text-white shadow-glow">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                Due today
              </p>
              <p className="mt-1 font-display text-4xl font-bold">
                {formatZar(Number(project.deposit_amount ?? 0))}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/65">
                One-third project deposit. Payment activates the team and starts delivery.
              </p>
            </div>

            <dl className="mt-6 divide-y divide-border/70 text-sm">
              <SummaryRow label="Fixed build fee" value={formatZar(Number(project.build_fee_amount ?? 0))} />
              <SummaryRow label="Delivery" value={`${project.timeline_weeks ?? proposal?.timelineWeeks ?? "—"} weeks`} />
              <SummaryRow label="Nominated team" value={`${project.matched_team?.length ?? 0} specialists`} />
              <SummaryRow label="Monthly after launch" value={`${formatZar(Number(project.monthly_fee_amount ?? 0))} / month`} />
            </dl>

            <div className="mt-6 rounded-2xl border border-border/70 bg-white/55 p-4 text-xs leading-relaxed text-muted-foreground">
              The remaining build fee is staged through delivery. Paddle provides the payment receipt and invoice; Somahorse.ai keeps it available in billing.
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-elevated backdrop-blur-xl">
            <div className="border-b border-border/60 px-5 py-4 sm:px-7">
              <p className="font-display text-lg font-bold text-navy">Complete payment</p>
              <p className="mt-1 text-xs text-muted-foreground">Secure checkout is provided by Paddle.</p>
            </div>
            {token && project.paddle_transaction_id ? (
              <PaddleCheckout
                projectId={project.id}
                transactionId={project.paddle_transaction_id}
                clientToken={token}
                environment={publicPaddleEnvironment()}
                customerEmail={user.email}
              />
            ) : (
              <div className="m-5 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-5 text-sm text-accent-amber sm:m-7">
                Secure checkout is not configured for this environment yet. Your proposal and project are safely saved.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold text-navy">{value}</dd>
    </div>
  );
}

