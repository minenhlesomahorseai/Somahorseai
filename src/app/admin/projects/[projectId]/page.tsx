import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Download,
  Mail,
  LayoutDashboard,
  UserRound,
  UsersRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { isAdminUser } from "@/lib/auth/admin";
import { formatZar } from "@/lib/projects/pricing";
import type { ProjectProposal } from "@/lib/projects/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface AdminProjectDetail {
  id: string;
  client_id: string;
  conversation_id: string | null;
  title: string;
  summary: string | null;
  status: string;
  sector: string | null;
  solution_type: string | null;
  delivery_format: string | null;
  problem: string | null;
  proposed_solution: string | null;
  proposal: ProjectProposal | null;
  timeline_weeks: number | null;
  build_fee_amount: number | null;
  deposit_amount: number | null;
  monthly_fee_amount: number | null;
  currency: string;
  payment_status: string;
  paddle_transaction_id: string | null;
  paid_at: string | null;
  started_at: string | null;
  created_at: string;
}

interface AssignmentRow {
  id: string;
  talent_id: string;
  role: string;
  match_score: number;
  reason: string | null;
  status: string;
  assigned_at: string | null;
}

interface PaymentRow {
  id: string;
  kind: string;
  amount: number;
  currency: string;
  status: string;
  provider_transaction_id: string;
  paid_at: string | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/projects/${projectId}`);
  if (!(await isAdminUser(supabase, user))) redirect("/");

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the admin project view");
  }

  const { data: rawProject } = await admin
    .from("projects")
    .select(
      "id, client_id, conversation_id, title, summary, status, sector, solution_type, delivery_format, problem, proposed_solution, proposal, timeline_weeks, build_fee_amount, deposit_amount, monthly_fee_amount, currency, payment_status, paddle_transaction_id, paid_at, started_at, created_at"
    )
    .eq("id", projectId)
    .maybeSingle();
  if (!rawProject) notFound();
  const project = rawProject as AdminProjectDetail;

  const [profileResult, assignmentResult, paymentResult, messageResult] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", project.client_id).maybeSingle(),
    admin
      .from("project_assignments")
      .select("id, talent_id, role, match_score, reason, status, assigned_at")
      .eq("project_id", project.id)
      .order("match_score", { ascending: false }),
    admin
      .from("payments")
      .select("id, kind, amount, currency, status, provider_transaction_id, paid_at, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    project.conversation_id
      ? admin
          .from("intake_messages")
          .select("id, role, content, created_at")
          .eq("conversation_id", project.conversation_id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as MessageRow[] }),
  ]);

  const assignments = (assignmentResult.data ?? []) as AssignmentRow[];
  const talentIds = assignments.map((assignment) => assignment.talent_id);
  const { data: talentProfiles } = talentIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", talentIds)
    : { data: [] };
  const talentById = new Map(
    (talentProfiles ?? []).map((profile) => [profile.id, profile])
  );
  const payments = (paymentResult.data ?? []) as PaymentRow[];
  const messages = (messageResult.data ?? []) as MessageRow[];
  const client = profileResult.data;
  const proposal = project.proposal;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background hero-field dotted-grid text-navy">
      <header className="relative z-10 border-b border-border/60 bg-white/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-mid">
            <ArrowLeft className="size-4" /> Projects
          </Link>
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/somahorse-logo.png"
              alt="Somahorse.ai"
              width={30}
              height={30}
              className="size-8 rounded-full object-contain"
            />
            <span className="font-display text-sm font-bold">
              Somahorse<span className="text-blue-vivid">.ai</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Status value={project.status} />
              <Status value={project.payment_status} payment />
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {project.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {project.summary ?? proposal?.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.payment_status === "paid" ? (
              <Link href={`/admin/projects/${project.id}/workspace`} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-bold text-white shadow-soft transition hover:bg-navy-mid">
                <LayoutDashboard className="size-4" /> Open workspace
              </Link>
            ) : null}
            {project.payment_status === "paid" && project.paddle_transaction_id ? (
              <Link href={`/api/paddle/invoice?projectId=${project.id}`} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-navy shadow-soft transition hover:bg-blue-mist">
                <Download className="size-4" /> Deposit invoice
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Banknote} label="Build fee" value={formatZar(Number(project.build_fee_amount ?? 0))} />
          <Metric icon={CheckCircle2} label="Deposit" value={formatZar(Number(project.deposit_amount ?? 0))} />
          <Metric icon={CalendarDays} label="Delivery" value={`${project.timeline_weeks ?? proposal?.timelineWeeks ?? "—"} weeks`} />
          <Metric icon={UsersRound} label="Assigned team" value={String(assignments.filter((item) => ["assigned", "active"].includes(item.status)).length)} />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <div className="space-y-6">
            <Panel title="Problem and delivery">
              <Detail label="Problem" value={project.problem ?? proposal?.problem} />
              <Detail label="Proposed solution" value={project.proposed_solution ?? proposal?.approach} />
              {proposal?.components?.length ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Components</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {proposal.components.map((component) => (
                      <span key={component} className="rounded-full bg-blue-light px-3 py-1.5 text-xs font-semibold text-navy-mid">
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {proposal?.milestones?.length ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Milestones</p>
                  <div className="mt-3 space-y-3">
                    {proposal.milestones.map((milestone, index) => (
                      <div key={`${milestone.title}-${index}`} className="rounded-2xl border border-border/70 bg-blue-mist/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-sm font-bold">{milestone.title}</p>
                          <span className="text-[11px] font-bold text-navy-mid">{milestone.durationWeeks} wk</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{milestone.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Panel>

            <Panel title="Nominated talent">
              {assignments.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignments.map((assignment) => {
                    const person = talentById.get(assignment.talent_id);
                    return (
                      <div key={assignment.id} className="rounded-2xl border border-border/70 bg-white/65 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-sm font-bold">{person?.full_name ?? "Talent member"}</p>
                            <p className="mt-0.5 text-xs font-semibold text-navy-mid">{assignment.role}</p>
                          </div>
                          <Status value={assignment.status} />
                        </div>
                        {person?.email ? <p className="mt-3 text-xs text-muted-foreground">{person.email}</p> : null}
                        {assignment.reason ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{assignment.reason}</p> : null}
                        <p className="mt-3 text-[11px] font-bold text-accent-teal">{assignment.match_score}% match</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty icon={CircleAlert} text="No assignment records yet. The paid project requires a staffing review." />
              )}
            </Panel>

            <Panel title="Saved intake transcript">
              {messages.length ? (
                <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "ml-auto bg-navy text-white"
                          : "border border-border/70 bg-blue-mist/35 text-navy"
                      }`}
                    >
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-60">
                        {message.role === "user" ? "Client" : "Soma AI"}
                      </p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={CircleAlert} text="No intake transcript is attached to this project." />
              )}
            </Panel>
          </div>

          <aside className="space-y-6">
            <Panel title="Client">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-blue-light text-navy-mid">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold">{client?.full_name ?? "Client"}</p>
                  <p className="truncate text-xs text-muted-foreground">{client?.email ?? project.client_id}</p>
                </div>
              </div>
              {client?.email ? (
                <a href={`mailto:${client.email}`} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-vivid hover:underline">
                  <Mail className="size-3.5" /> Contact client
                </a>
              ) : null}
            </Panel>

            <Panel title="Project record">
              <dl className="space-y-3 text-sm">
                <RecordRow label="Solution" value={project.solution_type?.replaceAll("_", " ") ?? "—"} />
                <RecordRow label="Format" value={project.delivery_format?.replaceAll("_", " ") ?? "—"} />
                <RecordRow label="Sector" value={project.sector ?? "—"} />
                <RecordRow label="Monthly" value={`${formatZar(Number(project.monthly_fee_amount ?? 0))} / mo`} />
                <RecordRow label="Created" value={formatDate(project.created_at)} />
                <RecordRow label="Paid" value={formatDate(project.paid_at)} />
                <RecordRow label="Started" value={formatDate(project.started_at)} />
              </dl>
            </Panel>

            <Panel title="Payments">
              {payments.length ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-border/70 bg-white/65 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold capitalize">{payment.kind.replaceAll("_", " ")}</p>
                        <Status value={payment.status} payment />
                      </div>
                      <p className="mt-2 font-display text-lg font-bold">{formatZar(Number(payment.amount))}</p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">{payment.provider_transaction_id}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={Banknote} text="No transaction has been prepared." />
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <p className="text-xs font-semibold">{label}</p>
      </div>
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-navy-mid">{value}</p>
    </div>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold capitalize">{value}</dd>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof CircleAlert; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-5 text-center">
      <Icon className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function Status({ value, payment = false }: { value: string; payment?: boolean }) {
  const good = ["paid", "assigned", "active", "in_build", "monitoring", "delivered"].includes(value);
  const warning = ["failed", "needs_replacement", "cancelled"].includes(value);
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
        good
          ? "bg-accent-teal/12 text-accent-teal"
          : warning
            ? "bg-danger/10 text-danger"
            : payment
              ? "bg-accent-amber/12 text-accent-amber"
              : "bg-blue-light text-navy-mid"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
