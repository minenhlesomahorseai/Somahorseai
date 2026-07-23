import Link from "next/link";
import { CreditCard, FileText, Plus, ReceiptText, ShieldCheck } from "lucide-react";

import { formatMinorMoney } from "@/lib/currency/config";
import { loadClientSession } from "@/lib/dashboard/session";
import { formatZar } from "@/lib/projects/pricing";
import { createClient } from "@/lib/supabase/server";

interface PaymentRow {
  id: string;
  project_id: string;
  kind: string;
  amount: number;
  currency: string;
  presentment_amount_minor: number | null;
  presentment_currency: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  invoice_number: string | null;
  paid_at: string | null;
  created_at: string;
  projects: { title: string } | { title: string }[] | null;
}
export default async function BillingPage() {
  const { userId } = await loadClientSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, project_id, kind, amount, currency, presentment_amount_minor, presentment_currency, status, invoice_number, paid_at, created_at, projects(title)"
    )
    .eq("client_id", userId)
    .order("created_at", { ascending: false });
  const payments = (data ?? []) as PaymentRow[];
  const paidByCurrency = new Map<string, number>();
  for (const payment of payments.filter((item) => item.status === "paid")) {
    const currency = payment.presentment_currency ?? payment.currency;
    const amountMinor =
      payment.presentment_amount_minor ?? Number(payment.amount) * 100;
    paidByCurrency.set(
      currency,
      (paidByCurrency.get(currency) ?? 0) + amountMinor
    );
  }
  const paidTotal =
    [...paidByCurrency.entries()]
      .map(([currency, amountMinor]) => formatMinorMoney(amountMinor, currency))
      .filter(Boolean)
      .join(" + ") || formatZar(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cue text-navy-mid/70">Account</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Billing
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Deposits, staged project payments, monthly support, and Paddle invoices.
          </p>
        </div>
        <Link
          href="/dashboard/client/new-project"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-mid px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
        >
          <Plus className="size-4" aria-hidden /> New project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-navy p-5 text-white shadow-glow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/60">Confirmed project amounts</p>
            <CreditCard className="size-5 text-white/55" aria-hidden />
          </div>
          <p className="mt-3 font-display text-3xl font-bold">{paidTotal}</p>
          <p className="mt-1 text-xs text-white/55">Across {payments.filter((payment) => payment.status === "paid").length} paid invoices</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Payment protection</p>
            <ShieldCheck className="size-5 text-accent-teal" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-bold text-navy">Projects activate only after verified payment.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Paddle handles payment details and tax. Its invoices are the final record of totals charged.</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/60 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blue-light/70 text-navy-mid">
            <ReceiptText className="size-7" aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">Invoices will appear here when you start a project.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/80 shadow-card">
          {payments.map((payment) => {
            const relation = Array.isArray(payment.projects) ? payment.projects[0] : payment.projects;
            return (
              <div key={payment.id} className="flex flex-col gap-3 border-b border-border/60 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-navy">{relation?.title ?? "Somahorse project"}</p>
                    <PaymentStatus status={payment.status} />
                  </div>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {payment.kind.replaceAll("_", " ")} · {formatDate(payment.paid_at ?? payment.created_at)}
                    {payment.invoice_number ? ` · Invoice ${payment.invoice_number}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="font-display text-lg font-bold text-navy">
                    {formatMinorMoney(
                      payment.presentment_amount_minor,
                      payment.presentment_currency
                    ) ?? formatZar(Number(payment.amount))}
                  </p>
                  {payment.status === "paid" ? (
                    <a
                      href={`/api/paddle/invoice?projectId=${payment.project_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-navy-mid transition hover:bg-blue-mist"
                    >
                      <FileText className="size-3.5" aria-hidden /> Invoice
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaymentStatus({ status }: { status: PaymentRow["status"] }) {
  const tone =
    status === "paid"
      ? "bg-accent-teal/12 text-accent-teal"
      : status === "failed"
        ? "bg-accent-amber/12 text-accent-amber"
        : "bg-blue-light text-navy-mid";
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${tone}`}>{status}</span>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date pending"
    : new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
