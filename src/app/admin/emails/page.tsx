import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

import { retryDelivery } from "./actions";

type DeliveryStatus = "pending" | "sending" | "sent" | "failed" | "cancelled";

interface DeliveryRow {
  id: string;
  category: string;
  recipient_email: string;
  subject: string;
  text_body: string;
  status: DeliveryStatus;
  provider_status: string | null;
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const FILTERS: Array<{ value: "all" | DeliveryStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export const metadata = { title: "Email inbox — Somahorse.ai Admin" };

export default async function AdminEmailInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/emails");
  if (!(await isAdminUser(supabase, user))) redirect("/");

  const requested = (await searchParams).status;
  const status = FILTERS.some((filter) => filter.value === requested)
    ? (requested as "all" | DeliveryStatus)
    : "all";
  let query = supabase
    .from("email_deliveries")
    .select(
      "id, category, recipient_email, subject, text_body, status, provider_status, attempt_count, last_error, sent_at, delivered_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") {
    query =
      status === "pending"
        ? query.in("status", ["pending", "sending"])
        : query.eq("status", status);
  }
  const { data } = await query;
  const deliveries = (data ?? []) as DeliveryRow[];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-bold text-navy-mid"
            >
              <ArrowLeft className="size-3.5" /> Admin console
            </Link>
            <p className="mt-6 cue text-blue-vivid">Transactional email</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-navy">
              Email inbox
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Delivery status, recipients, message copy, failures, and targeted retries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Link
                key={filter.value}
                href={
                  filter.value === "all"
                    ? "/admin/emails"
                    : `/admin/emails?status=${filter.value}`
                }
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  status === filter.value
                    ? "bg-navy text-white"
                    : "border border-border bg-white text-navy-mid"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {deliveries.length ? (
            deliveries.map((delivery) => (
              <article
                key={delivery.id}
                className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-soft"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <DeliveryBadge status={delivery.status} />
                      <span className="rounded-full bg-blue-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-mid">
                        {delivery.category.replaceAll("_", " ")}
                      </span>
                    </div>
                    <h2 className="mt-3 truncate font-display text-lg font-bold text-navy">
                      {delivery.subject}
                    </h2>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      To {delivery.recipient_email} · {formatDate(delivery.created_at)}
                      {delivery.attempt_count
                        ? ` · ${delivery.attempt_count} attempt${delivery.attempt_count === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                  {delivery.status === "failed" || delivery.status === "pending" ? (
                    <form action={retryDelivery}>
                      <input type="hidden" name="deliveryId" value={delivery.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-navy-mid px-4 py-2 text-xs font-bold text-white"
                      >
                        <RefreshCw className="size-3.5" /> Send now
                      </button>
                    </form>
                  ) : null}
                </div>
                {delivery.last_error ? (
                  <p className="mt-4 rounded-2xl border border-accent-amber/20 bg-accent-amber/8 p-3 text-xs leading-5 text-accent-amber">
                    {delivery.last_error}
                  </p>
                ) : null}
                <details className="mt-4 border-t border-border/60 pt-4">
                  <summary className="cursor-pointer text-xs font-bold text-blue-vivid">
                    Read message
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-blue-mist/45 p-4 font-sans text-xs leading-6 text-navy/75">
                    {delivery.text_body}
                  </pre>
                </details>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-white/60 py-16 text-center">
              <Mail className="mx-auto size-8 text-blue-vivid/30" />
              <p className="mt-3 text-sm font-bold text-navy">No email deliveries in this view</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  const Icon =
    status === "sent"
      ? CheckCircle2
      : status === "failed"
        ? TriangleAlert
        : Clock3;
  const tone =
    status === "sent"
      ? "bg-accent-teal/10 text-accent-teal"
      : status === "failed"
        ? "bg-accent-amber/10 text-accent-amber"
        : "bg-blue-vivid/10 text-blue-vivid";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${tone}`}>
      <Icon className="size-3" /> {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

