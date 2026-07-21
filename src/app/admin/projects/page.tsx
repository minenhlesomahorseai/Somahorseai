import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/auth/admin";
import { formatZar } from "@/lib/projects/pricing";
import { createClient } from "@/lib/supabase/server";

interface AdminProject {
  id: string;
  client_id: string;
  title: string;
  summary: string | null;
  status: string;
  payment_status: string;
  deposit_amount: number | null;
  monthly_fee_amount: number | null;
  matched_team: string[] | null;
  started_at: string | null;
  created_at: string;
}

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/projects");
  if (!(await isAdminUser(supabase, user))) redirect("/");

  const { data } = await supabase
    .from("projects")
    .select(
      "id, client_id, title, summary, status, payment_status, deposit_amount, monthly_fee_amount, matched_team, started_at, created_at"
    )
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as AdminProject[];
  const paid = projects.filter((project) => project.payment_status === "paid");
  const pending = projects.filter((project) => project.payment_status === "pending");
  const needsStaffing = projects.filter(
    (project) => project.status === "matching" && project.payment_status === "paid"
  );
  const deposits = paid.reduce(
    (total, project) => total + Number(project.deposit_amount ?? 0),
    0
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-background hero-field dotted-grid text-navy">
      <header className="relative z-10 border-b border-border/60 bg-white/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-mid">
            <ArrowLeft className="size-4" /> Certification
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

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-9 sm:px-6">
        <p className="cue text-navy-mid/70">Internal control</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Projects and payments
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every scoped project, transaction state, team, and staffing exception.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminStat label="Projects" value={String(projects.length)} icon={FolderKanban} />
          <AdminStat label="Paid deposits" value={formatZar(deposits)} icon={CircleDollarSign} />
          <AdminStat label="Awaiting payment" value={String(pending.length)} icon={Clock3} />
          <AdminStat
            label="Staffing exceptions"
            value={String(needsStaffing.length)}
            icon={UsersRound}
            alert={needsStaffing.length > 0}
          />
        </div>

        <div className="mt-7 overflow-hidden rounded-3xl border border-border/70 bg-white/80 shadow-card backdrop-blur-sm">
          {projects.length ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="flex flex-col gap-3 border-b border-border/60 p-5 transition last:border-0 hover:bg-blue-mist/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-base font-bold">{project.title}</p>
                    <Status value={project.status} />
                    <Status value={project.payment_status} payment />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {project.summary ?? "No summary"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatZar(Number(project.deposit_amount ?? 0))}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {project.matched_team?.length ?? 0} nominated
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-navy-mid" />
                </div>
              </Link>
            ))
          ) : (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No projects have reached the control room yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function AdminStat({
  label,
  value,
  icon: Icon,
  alert = false,
}: {
  label: string;
  value: string;
  icon: typeof FolderKanban;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
        alert ? "border-accent-amber/30 bg-accent-amber/10" : "border-border/70 bg-white/80"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${alert ? "text-accent-amber" : "text-navy-mid"}`} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Status({ value, payment = false }: { value: string; payment?: boolean }) {
  const good = ["paid", "in_build", "monitoring", "delivered"].includes(value);
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
        good
          ? "bg-accent-teal/12 text-accent-teal"
          : payment
            ? "bg-accent-amber/12 text-accent-amber"
            : "bg-blue-light text-navy-mid"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

