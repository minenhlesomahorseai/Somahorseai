import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, ReceiptText, ShieldCheck } from "lucide-react";

import { TalentEmptyState, TalentGlassCard, TalentPageHeader, TalentSectionTitle } from "@/components/dashboard/talent-ui";
import { loadTalentSession } from "@/lib/dashboard/talent";
import { formatZar } from "@/lib/projects/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

interface TalentEarningRow {
  id: string;
  project_id: string;
  payment_id: string;
  client_payment_amount: number;
  talent_pool_amount: number;
  amount_owed: number;
  share_percent: number;
  status: "owed" | "paid" | "held" | "cancelled";
  paid_at: string | null;
  payout_reference: string | null;
  created_at: string;
  projects: { title: string } | Array<{ title: string }> | null;
  payments: { kind: string; description: string | null; paid_at: string | null } | Array<{ kind: string; description: string | null; paid_at: string | null }> | null;
}

export default async function TalentPaymentsPage() {
  const { userId } = await loadTalentSession();
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the talent earnings ledger");
  const { data } = await admin
    .from("talent_earnings")
    .select("id, project_id, payment_id, client_payment_amount, talent_pool_amount, amount_owed, share_percent, status, paid_at, payout_reference, created_at, projects(title), payments(kind, description, paid_at)")
    .eq("talent_id", userId)
    .order("created_at", { ascending: false });
  const earnings = (data ?? []) as unknown as TalentEarningRow[];
  const total = earnings.filter((item) => !["cancelled", "held"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount_owed), 0);
  const owed = earnings.filter((item) => item.status === "owed").reduce((sum, item) => sum + Number(item.amount_owed), 0);
  const paid = earnings.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_owed), 0);

  return (
    <div className="space-y-6">
      <TalentPageHeader eyebrow="Earnings" title="Payments" description="Every verified client payment, your exact project allocation, and the payout status from the control room." />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="talent-glass-dark rounded-[1.75rem] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-white/55">Total earned</p><CircleDollarSign className="size-5 text-accent-teal" aria-hidden /></div>
          <p className="mt-3 font-display text-3xl font-bold">{formatZar(total)}</p>
          <p className="mt-1 text-[11px] text-white/45">Across {earnings.length} allocations</p>
        </div>
        <div className="talent-glass rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">Owed to you</p><Clock3 className="size-5 text-accent-amber" aria-hidden /></div>
          <p className="mt-3 font-display text-3xl font-bold text-navy">{formatZar(owed)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting admin payout</p>
        </div>
        <div className="talent-glass rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">Received</p><CheckCircle2 className="size-5 text-accent-teal" aria-hidden /></div>
          <p className="mt-3 font-display text-3xl font-bold text-navy">{formatZar(paid)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Marked paid by control room</p>
        </div>
      </div>

      <TalentGlassCard>
        <TalentSectionTitle title="Earnings ledger" icon={ReceiptText} />
        {earnings.length ? (
          <div className="space-y-3">
            {earnings.map((earning) => {
              const project = relation(earning.projects);
              const payment = relation(earning.payments);
              return (
                <div key={earning.id} className="flex flex-col gap-3 rounded-2xl border border-white/75 bg-white/48 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-navy">{project?.title ?? "Somahorse project"}</p><Status value={earning.status} /></div>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{payment?.description ?? payment?.kind?.replaceAll("_", " ") ?? "Project payment"} · {formatDate(payment?.paid_at ?? earning.created_at)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Client paid {formatZar(earning.client_payment_amount)} · 60% pool {formatZar(earning.talent_pool_amount)} · Your share {earning.share_percent}%</p>
                    {earning.payout_reference ? <p className="mt-1 text-[10px] font-semibold text-accent-teal">Reference: {earning.payout_reference}</p> : null}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end"><p className="font-display text-xl font-bold text-navy">{formatZar(earning.amount_owed)}</p><Link href={`/dashboard/talent/projects/${earning.project_id}`} className="grid size-9 place-items-center rounded-full border border-border bg-white text-navy-mid" aria-label="Open project workspace"><ArrowUpRight className="size-4" aria-hidden /></Link></div>
                </div>
              );
            })}
          </div>
        ) : (
          <TalentEmptyState icon={ReceiptText} title="No earnings recorded yet" description="When a client payment is verified, your share of the project’s 60% talent pool appears here automatically." />
        )}
      </TalentGlassCard>

      <TalentGlassCard>
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-teal/10 text-accent-teal"><ShieldCheck className="size-5" aria-hidden /></span><div><p className="text-sm font-bold text-navy">Transparent 60/40 accounting</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Sixty percent of each verified project payment is allocated across the assigned talent team. Client payment confirmation and admin payout settlement remain separate auditable records.</p></div></div>
      </TalentGlassCard>
    </div>
  );
}

function relation<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function Status({ value }: { value: TalentEarningRow["status"] }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${value === "paid" ? "bg-accent-teal/10 text-accent-teal" : value === "owed" ? "bg-accent-amber/10 text-accent-amber" : "bg-blue-light text-navy-mid"}`}>{value}</span>; }
function formatDate(value: string | null) { if (!value) return "Date pending"; return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
