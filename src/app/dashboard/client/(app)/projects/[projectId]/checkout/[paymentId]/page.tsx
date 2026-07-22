import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { loadClientSession } from "@/lib/dashboard/session";
import { paddleClientToken, publicPaddleEnvironment } from "@/lib/payments/paddle";
import { formatZar } from "@/lib/projects/pricing";
import { createClient } from "@/lib/supabase/server";

import { WorkspacePaddleCheckout } from "./workspace-paddle-checkout";

export default async function WorkspaceCheckoutPage({
  params,
}: {
  params: Promise<{ projectId: string; paymentId: string }>;
}) {
  const { projectId, paymentId } = await params;
  const { userId, user } = await loadClientSession();
  const supabase = await createClient();
  const [{ data: payment }, { data: project }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, project_id, amount, currency, status, provider_transaction_id, description")
      .eq("id", paymentId)
      .eq("project_id", projectId)
      .eq("client_id", userId)
      .maybeSingle(),
    supabase.from("projects").select("id, title").eq("id", projectId).eq("client_id", userId).maybeSingle(),
  ]);
  if (!payment || !project) notFound();
  if (payment.status === "paid") redirect(`/dashboard/client/projects/${projectId}`);
  const token = paddleClientToken();

  return (
    <div className="space-y-5">
      <Link href={`/dashboard/client/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-navy-mid transition hover:text-blue-vivid">
        <ArrowLeft className="size-4" aria-hidden /> Back to project workspace
      </Link>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)] lg:items-start">
        <section className="talent-glass rounded-[2rem] p-5 sm:p-7 lg:sticky lg:top-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-accent-teal">
            <ShieldCheck className="size-3.5" aria-hidden /> Secure project payment
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-navy">{project.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{payment.description ?? "Project delivery payment"}</p>
          <div className="mt-6 rounded-3xl bg-navy p-5 text-white shadow-glow">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Amount due</p>
            <p className="mt-1 font-display text-4xl font-bold">{formatZar(Number(payment.amount))}</p>
            <p className="mt-2 text-xs leading-5 text-white/60">Paddle will issue the transaction invoice after payment is verified.</p>
          </div>
          <div className="mt-5 rounded-2xl bg-blue-vivid/8 p-4 text-xs leading-5 text-navy-mid">This payment is recorded against the project ledger and automatically creates the team&apos;s 60% earnings allocation.</div>
        </section>
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-elevated backdrop-blur-xl">
          {token ? (
            <WorkspacePaddleCheckout
              projectId={projectId}
              paymentId={paymentId}
              transactionId={payment.provider_transaction_id}
              clientToken={token}
              environment={publicPaddleEnvironment()}
              customerEmail={user.email}
            />
          ) : (
            <div className="m-6 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-5 text-sm text-accent-amber">Secure checkout is not configured for this environment.</div>
          )}
        </section>
      </div>
    </div>
  );
}
