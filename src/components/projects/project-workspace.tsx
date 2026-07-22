"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  closeProjectWorkspace,
  completeWorkspaceTask,
  initializeProjectWorkspace,
  prepareWorkspacePayment,
  sendWorkspaceMessage,
  settleTalentEarning,
} from "@/app/dashboard/project-workspace-actions";
import type {
  ProjectWorkspaceData,
  WorkspaceMessage,
  WorkspaceMessageRead,
  WorkspaceMilestone,
  WorkspaceRole,
} from "@/lib/projects/workspace";
import { createClient } from "@/lib/supabase/client";

type WorkspaceTab = "overview" | "milestones" | "messages" | "finance";

export function ProjectWorkspaceBootstrap({ projectId, role }: { projectId: string; role: WorkspaceRole }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await initializeProjectWorkspace(projectId);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Workspace generation is taking longer than expected.");
    });
  }, [projectId, router]);

  return (
    <div className="workspace-glass flex min-h-[32rem] flex-col items-center justify-center rounded-[2rem] px-6 text-center">
      <span className="relative grid size-20 place-items-center rounded-[2rem] bg-gradient-to-br from-navy to-blue-vivid text-white shadow-glow">
        {pending ? <Loader2 className="size-8 animate-spin" aria-hidden /> : <Sparkles className="size-8" aria-hidden />}
        <span className="absolute -right-1 -top-1 size-4 rounded-full bg-accent-teal ring-4 ring-white" />
      </span>
      <p className="mt-6 cue text-blue-vivid">Project management agent</p>
      <h1 className="mt-2 max-w-lg font-display text-3xl font-bold text-navy">Building your shared project workspace</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The accepted scope is being converted into milestones, accountable tasks, payment stages, and a secure team channel.
      </p>
      {error ? (
        <div className="mt-6 rounded-2xl border border-accent-amber/25 bg-accent-amber/10 p-4 text-sm text-accent-amber">
          {error}
          <button type="button" onClick={() => router.refresh()} className="ml-2 font-bold underline">Retry</button>
        </div>
      ) : null}
      <Link href={role === "talent" ? "/dashboard/talent/projects" : role === "client" ? "/dashboard/client/projects" : "/admin/projects"} className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-navy-mid">
        <ArrowLeft className="size-3.5" aria-hidden /> Back to projects
      </Link>
    </div>
  );
}

export function ProjectWorkspace({
  data,
  role,
  currentUserId,
  paymentReady,
  paymentConfirmed = false,
  initialTab,
}: {
  data: ProjectWorkspaceData;
  role: WorkspaceRole;
  currentUserId: string;
  paymentReady: boolean;
  paymentConfirmed?: boolean;
  initialTab?: WorkspaceTab;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(paymentConfirmed ? "finance" : initialTab ?? "overview");
  const [milestones, setMilestones] = useState(data.milestones);
  const [progress, setProgress] = useState(data.workspace?.progress_percent ?? 0);
  const [messages, setMessages] = useState(data.messages);
  const [messageReads, setMessageReads] = useState(data.messageReads);
  const [messageText, setMessageText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [completing, startTaskTransition] = useTransition();
  const [sending, startMessageTransition] = useTransition();
  const messageEndRef = useRef<HTMLDivElement>(null);

  const memberNameById = useMemo(
    () => new Map(data.members.map((member) => [member.id, member.fullName ?? "Project participant"])),
    [data.members]
  );
  const completedTasks = milestones.flatMap((item) => item.tasks).filter((task) => task.status === "completed").length;
  const totalTasks = milestones.flatMap((item) => item.tasks).length;
  const nextMilestone = milestones.find((item) => item.status !== "completed") ?? milestones[milestones.length - 1];
  const paidTotal = data.payments.filter((payment) => payment.status === "paid").reduce((sum, item) => sum + Number(item.amount), 0);
  const buildPaid = data.payments.filter((payment) => payment.status === "paid" && payment.kind !== "monthly").reduce((sum, item) => sum + Number(item.amount), 0);
  const outstandingBuild = Math.max(0, Number(data.project.build_fee_amount ?? 0) - buildPaid);
  const ownEarnings = data.earnings.filter((earning) => earning.talent_id === currentUserId);
  const ownLastReadAt = messageReads.find((read) => read.user_id === currentUserId)?.last_read_at;
  const unreadMessages = messages.filter(
    (message) =>
      message.sender_id !== currentUserId &&
      (!ownLastReadAt || new Date(message.created_at).getTime() > new Date(ownLastReadAt).getTime())
  ).length;

  useEffect(() => {
    const client = createClient();
    const channel = client
      .channel(`workspace-messages:${data.project.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${data.project.id}` },
        (payload) => {
          const incoming = payload.new as Omit<WorkspaceMessage, "sender_name">;
          setMessages((current) =>
            current.some((message) => message.id === incoming.id)
              ? current
              : [
                  ...current,
                  {
                    ...incoming,
                    sender_name:
                      incoming.sender_role === "admin"
                        ? "Somahorse control room"
                        : memberNameById.get(incoming.sender_id) ?? "Project participant",
                  },
                ]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_message_reads", filter: `project_id=eq.${data.project.id}` },
        (payload) => {
          const incoming = payload.new as WorkspaceMessageRead;
          if (!incoming?.user_id) return;
          setMessageReads((current) => [
            ...current.filter((read) => read.user_id !== incoming.user_id),
            incoming,
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "project_tasks", filter: `project_id=eq.${data.project.id}` },
        (payload) => {
          const incoming = payload.new as WorkspaceMilestone["tasks"][number];
          setMilestones((current) =>
            current.map((milestone) => ({
              ...milestone,
              tasks: milestone.tasks.map((task) => (task.id === incoming.id ? { ...task, ...incoming } : task)),
            }))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "project_milestones", filter: `project_id=eq.${data.project.id}` },
        (payload) => {
          const incoming = payload.new as Omit<WorkspaceMilestone, "tasks">;
          setMilestones((current) =>
            current.map((milestone) => (milestone.id === incoming.id ? { ...milestone, ...incoming } : milestone))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "project_workspaces", filter: `project_id=eq.${data.project.id}` },
        (payload) => {
          const incoming = payload.new as { progress_percent?: number };
          if (typeof incoming.progress_percent === "number") setProgress(incoming.progress_percent);
        }
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [data.project.id, memberNameById]);

  useEffect(() => {
    if (activeTab === "messages") messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeTab, messages]);

  useEffect(() => {
    if (activeTab !== "messages" || messages.length === 0) return;
    const latestMessageAt = messages.at(-1)?.created_at;
    if (!latestMessageAt || (ownLastReadAt && new Date(ownLastReadAt) >= new Date(latestMessageAt))) return;

    const readAt = new Date().toISOString();
    const client = createClient();
    void client
      .from("project_message_reads")
      .upsert(
        { project_id: data.project.id, user_id: currentUserId, last_read_at: readAt },
        { onConflict: "project_id,user_id" }
      )
      .then(({ error }) => {
        if (error) return;
        setMessageReads((current) => [
          ...current.filter((read) => read.user_id !== currentUserId),
          { project_id: data.project.id, user_id: currentUserId, last_read_at: readAt, updated_at: readAt },
        ]);
      });
    void client
      .from("notifications")
      .update({ read_at: readAt })
      .eq("project_id", data.project.id)
      .eq("type", "project_message")
      .is("read_at", null);
  }, [activeTab, currentUserId, data.project.id, messages, ownLastReadAt]);

  const handleCompleteTask = (taskId: string) => {
    setActionError(null);
    startTaskTransition(async () => {
      const result = await completeWorkspaceTask(taskId);
      if (!result.ok) {
        setActionError(result.error ?? "Task could not be completed");
        return;
      }
      setProgress(result.progress ?? progress);
      setMilestones((current) =>
        current.map((milestone) => {
          const updatedTasks = milestone.tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: "completed" as const, completed_by: currentUserId, completed_at: new Date().toISOString() }
              : task
          );
          const isComplete = updatedTasks.every((task) => task.status === "completed");
          return {
            ...milestone,
            tasks: updatedTasks,
            ...(isComplete
              ? {
                  status: "completed" as const,
                  completed_at: new Date().toISOString(),
                  payment_status:
                    milestone.payment_amount > 0 && milestone.payment_status === "not_due"
                      ? ("due" as const)
                      : milestone.payment_status,
                }
              : {}),
          };
        })
      );
    });
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = messageText.trim();
    if (!body) return;
    setActionError(null);
    startMessageTransition(async () => {
      const result = await sendWorkspaceMessage(data.project.id, body);
      if (!result.ok || !result.message) {
        setActionError(result.error ?? "Message could not be sent");
        return;
      }
      setMessages((current) =>
        current.some((message) => message.id === result.message!.id) ? current : [...current, result.message!]
      );
      setMessageText("");
    });
  };

  const tabs: Array<{ id: WorkspaceTab; label: string; icon: typeof FolderKanban }> = [
    { id: "overview", label: "Overview", icon: FolderKanban },
    { id: "milestones", label: role === "talent" ? "Team tasks" : "Milestones", icon: CheckCircle2 },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "finance", label: role === "talent" ? "Earnings" : role === "admin" ? "Finance" : "Payments", icon: WalletCards },
  ];
  const backHref = role === "talent" ? "/dashboard/talent/projects" : role === "client" ? "/dashboard/client/projects" : "/admin/projects";

  return (
    <div className="space-y-5">
      {paymentConfirmed ? (
        <div className="flex items-start gap-3 rounded-2xl border border-accent-teal/20 bg-accent-teal/10 p-4 text-accent-teal" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div><p className="text-sm font-bold">Payment confirmed and recorded.</p><p className="mt-0.5 text-xs opacity-80">The team earnings ledger and project invoice have been updated.</p></div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-bold text-navy-mid transition hover:text-blue-vivid">
          <ArrowLeft className="size-4" aria-hidden /> Projects
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-teal/15 bg-white/60 px-3 py-1.5 text-[10px] font-bold text-accent-teal backdrop-blur-xl">
          <LockKeyhole className="size-3" aria-hidden /> Participant-only workspace
        </span>
      </div>

      <section className="workspace-hero relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">{role} workspace</span>
              <WorkspaceStatus value={data.workspace?.status ?? "active"} />
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl">{data.project.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{data.project.summary ?? "Shared project delivery, progress, communication, and payments."}</p>
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Overall progress</p><p className="mt-1 font-display text-4xl font-bold">{progress}%</p></div><span className="grid size-11 place-items-center rounded-2xl bg-accent-teal/15 text-accent-teal"><Check className="size-5" aria-hidden /></span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-sky to-accent-teal transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-[11px] text-white/50">{completedTasks} of {totalTasks} delivery tasks complete</p>
          </div>
        </div>
      </section>

      <nav className="sticky top-[4.1rem] z-30 overflow-hidden rounded-2xl border border-border/70 bg-white p-1.5 shadow-nav lg:top-[5.8rem]" aria-label="Project workspace">
        <div className="no-scrollbar grid snap-x snap-mandatory grid-flow-col auto-cols-[calc((100%_-_0.25rem)_/_2)] gap-1 overflow-x-auto scroll-smooth sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-4 sm:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-w-0 snap-start items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:px-4 ${active ? "bg-navy text-white shadow-glow" : "text-muted-foreground hover:bg-blue-mist hover:text-navy"}`}>
                <Icon className="size-4" aria-hidden /> {tab.label}
                {tab.id === "messages" && unreadMessages ? <span className={`rounded-full px-1.5 text-[9px] ${active ? "bg-white/15" : "bg-blue-vivid/10 text-blue-vivid"}`}>{unreadMessages > 9 ? "9+" : unreadMessages}</span> : null}
              </button>
            );
          })}
        </div>
        <span className="pointer-events-none absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-mid shadow-soft sm:hidden" aria-hidden>
          <ChevronRight className="size-3.5" />
        </span>
      </nav>

      {actionError ? <div className="rounded-2xl border border-accent-amber/25 bg-accent-amber/10 p-3 text-sm text-accent-amber" role="alert">{actionError}</div> : null}

      {activeTab === "overview" ? (
        <OverviewTab
          data={data}
          role={role}
          progress={progress}
          nextMilestone={nextMilestone}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          paidTotal={paidTotal}
          ownEarnings={ownEarnings.reduce((sum, item) => sum + Number(item.amount_owed), 0)}
        />
      ) : null}
      {activeTab === "milestones" ? (
        <MilestonesTab milestones={milestones} role={role} completing={completing} onComplete={handleCompleteTask} members={data.members} />
      ) : null}
      {activeTab === "messages" ? (
        <MessagesTab messages={messages} messageReads={messageReads} currentUserId={currentUserId} value={messageText} sending={sending} onChange={setMessageText} onSubmit={handleSendMessage} endRef={messageEndRef} />
      ) : null}
      {activeTab === "finance" ? (
        <FinanceTab
          data={{ ...data, milestones }}
          role={role}
          currentUserId={currentUserId}
          paymentReady={paymentReady}
          paidTotal={paidTotal}
          outstandingBuild={outstandingBuild}
        />
      ) : null}
    </div>
  );
}

function OverviewTab({
  data,
  role,
  progress,
  nextMilestone,
  completedTasks,
  totalTasks,
  paidTotal,
  ownEarnings,
}: {
  data: ProjectWorkspaceData;
  role: WorkspaceRole;
  progress: number;
  nextMilestone?: WorkspaceMilestone;
  completedTasks: number;
  totalTasks: number;
  paidTotal: number;
  ownEarnings: number;
}) {
  const daysRemaining = getDaysRemaining(data.workspace?.expected_completion_at);
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <WorkspaceCard className="lg:col-span-8">
        <SectionTitle icon={Sparkles} title={role === "talent" ? "Team delivery focus" : role === "admin" ? "Control-room summary" : "Project progress"} />
        <div className="grid gap-4 sm:grid-cols-3">
          <OverviewMetric icon={CheckCircle2} value={`${progress}%`} label="Complete" tone="teal" />
          <OverviewMetric icon={CalendarClock} value={daysRemaining == null ? "—" : `${daysRemaining}d`} label="Time remaining" />
          <OverviewMetric icon={UsersRound} value={String(data.members.filter((item) => item.participantRole === "talent").length)} label="Talent involved" />
        </div>
        {nextMilestone ? (
          <div className="mt-5 rounded-2xl border border-blue-vivid/12 bg-blue-vivid/6 p-4 sm:flex sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-vivid">{nextMilestone.status === "completed" ? "Final milestone" : "Current milestone"}</p><p className="mt-1 font-display text-lg font-bold text-navy">{nextMilestone.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{nextMilestone.description}</p></div>
            <span className="mt-3 inline-flex shrink-0 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-navy-mid sm:ml-5 sm:mt-0">{nextMilestone.tasks.filter((task) => task.status === "completed").length}/{nextMilestone.tasks.length} tasks</span>
          </div>
        ) : null}
      </WorkspaceCard>

      <WorkspaceCard className="lg:col-span-4">
        <SectionTitle icon={UsersRound} title="Project group" />
        <div className="space-y-3">
          {data.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-white/45 p-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${member.participantRole === "client" ? "bg-navy text-white" : "bg-blue-vivid/10 text-blue-vivid"}`}>{initials(member.fullName)}</span>
              <div className="min-w-0"><p className="truncate text-xs font-bold text-navy">{member.fullName}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{member.role}</p></div>
              {member.participantRole === "talent" ? <BadgeCheck className="ml-auto size-4 shrink-0 text-accent-teal" aria-label="Certified talent" /> : null}
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-2xl bg-accent-teal/7 p-3"><span className="grid size-10 place-items-center rounded-full bg-accent-teal/12 text-accent-teal"><ShieldCheck className="size-5" aria-hidden /></span><div><p className="text-xs font-bold text-navy">Somahorse control room</p><p className="mt-0.5 text-[11px] text-muted-foreground">Admin oversight and support</p></div></div>
        </div>
      </WorkspaceCard>

      <WorkspaceCard className="lg:col-span-7">
        <SectionTitle icon={FileText} title="Delivery health" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/45 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Task completion</p><p className="mt-2 font-display text-2xl font-bold text-navy">{completedTasks} <span className="text-sm text-muted-foreground">of {totalTasks}</span></p></div>
          <div className="rounded-2xl bg-white/45 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">AI plan source</p><p className="mt-2 font-display text-2xl font-bold capitalize text-navy">{data.workspace?.generated_by ?? "Preparing"}</p></div>
        </div>
      </WorkspaceCard>

      <WorkspaceCard className="lg:col-span-5">
        <SectionTitle icon={role === "talent" ? Banknote : CircleDollarSign} title={role === "talent" ? "Your project earnings" : "Project financials"} />
        <p className="font-display text-3xl font-bold text-navy">{formatZar(role === "talent" ? ownEarnings : paidTotal)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{role === "talent" ? "Allocated from verified client payments" : "Verified payments received to date"}</p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-teal/8 p-3 text-xs text-accent-teal"><ShieldCheck className="size-4 shrink-0" aria-hidden /> Payment and payout ledgers are reconciled separately.</div>
      </WorkspaceCard>
    </div>
  );
}

function MilestonesTab({ milestones, role, completing, onComplete, members }: { milestones: WorkspaceMilestone[]; role: WorkspaceRole; completing: boolean; onComplete: (id: string) => void; members: ProjectWorkspaceData["members"] }) {
  const memberNames = new Map(members.map((member) => [member.id, member.fullName]));
  return (
    <div className="space-y-4">
      {milestones.map((milestone, milestoneIndex) => {
        const done = milestone.tasks.filter((task) => task.status === "completed").length;
        const percent = milestone.tasks.length ? Math.round((done / milestone.tasks.length) * 100) : 0;
        return (
          <WorkspaceCard key={milestone.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-2xl text-sm font-bold ${milestone.status === "completed" ? "bg-accent-teal text-white" : "bg-blue-vivid/10 text-blue-vivid"}`}>{milestone.status === "completed" ? <Check className="size-5" aria-hidden /> : milestoneIndex + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold text-navy">{milestone.title}</h2><MilestoneStatus value={milestone.status} /></div><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{milestone.description}</p></div></div>
              <div className="shrink-0 text-right"><p className="font-display text-2xl font-bold text-navy">{percent}%</p><p className="text-[10px] font-semibold text-muted-foreground">{done}/{milestone.tasks.length} tasks</p></div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-blue-light"><div className="h-full rounded-full bg-gradient-to-r from-blue-vivid to-accent-teal transition-[width] duration-500" style={{ width: `${percent}%` }} /></div>
            <div className="mt-5 space-y-2">
              {milestone.tasks.map((task) => {
                const isDone = task.status === "completed";
                const canComplete = role === "talent" && !isDone;
                return (
                  <div key={task.id} className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${isDone ? "border-accent-teal/10 bg-accent-teal/6" : "border-white/75 bg-white/48"}`}>
                    {canComplete ? (
                      <button type="button" disabled={completing} onClick={() => onComplete(task.id)} aria-label={`Mark ${task.title} complete`} className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-blue-vivid/25 bg-white text-blue-vivid transition hover:border-accent-teal hover:bg-accent-teal hover:text-white disabled:opacity-50"><Check className="size-3.5" aria-hidden /></button>
                    ) : isDone ? (
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent-teal text-white"><Check className="size-3.5" aria-hidden /></span>
                    ) : (
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-blue-vivid/15 bg-white"><Circle className="size-3 text-blue-vivid/30" aria-hidden /></span>
                    )}
                    <div className="min-w-0 flex-1"><p className={`text-sm font-bold ${isDone ? "text-navy/55 line-through" : "text-navy"}`}>{task.title}</p>{task.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{task.description}</p> : null}<div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground">{task.assigned_talent_id ? <span className="rounded-full bg-blue-light/60 px-2 py-1">{memberNames.get(task.assigned_talent_id) ?? "Assigned talent"}</span> : <span className="rounded-full bg-blue-light/60 px-2 py-1">Shared team task</span>}{task.completed_at ? <span className="rounded-full bg-accent-teal/8 px-2 py-1 text-accent-teal">Completed {formatDate(task.completed_at)}</span> : null}</div></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-4"><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden /> {milestone.duration_days} planned days</span>{milestone.payment_amount > 0 ? <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${milestone.payment_status === "paid" ? "bg-accent-teal/10 text-accent-teal" : milestone.payment_status === "due" ? "bg-accent-amber/12 text-accent-amber" : "bg-blue-light text-navy-mid"}`}>{formatZar(milestone.payment_amount)} · {milestone.payment_status.replaceAll("_", " ")}</span> : null}</div>
          </WorkspaceCard>
        );
      })}
    </div>
  );
}

function MessagesTab({ messages, messageReads, currentUserId, value, sending, onChange, onSubmit, endRef }: { messages: WorkspaceMessage[]; messageReads: WorkspaceMessageRead[]; currentUserId: string; value: string; sending: boolean; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; endRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <section className="workspace-chat overflow-hidden rounded-[2rem] border border-white/70 shadow-card">
      <div className="flex items-center justify-between border-b border-white/70 bg-white/62 px-4 py-3.5 sm:px-5"><div className="flex items-center gap-3"><span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-vivid text-white"><UsersRound className="size-5" aria-hidden /><span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-accent-teal" /></span><div><p className="text-sm font-bold text-navy">Project group</p><p className="text-[11px] text-accent-teal">Client · Talent · Control room</p></div></div><span className="hidden items-center gap-1.5 rounded-full bg-accent-teal/8 px-3 py-1.5 text-[10px] font-bold text-accent-teal sm:inline-flex"><LockKeyhole className="size-3" aria-hidden /> Secured workspace</span></div>
      <div className="h-[28rem] space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(239,246,255,.5),rgba(255,255,255,.65))] p-4 sm:h-[34rem] sm:p-6">
        {messages.length ? messages.map((message) => {
          const own = message.sender_id === currentUserId;
          const admin = message.sender_role === "admin";
          return (
            <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-soft sm:max-w-[72%] ${own ? "rounded-br-md bg-navy text-white" : admin ? "rounded-bl-md border border-accent-teal/15 bg-accent-teal/8 text-navy" : "rounded-bl-md border border-white bg-white/88 text-navy"}`}>
                {!own ? <p className={`mb-1 text-[10px] font-bold ${admin ? "text-accent-teal" : "text-blue-vivid"}`}>{message.sender_name}</p> : null}
                <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                <p className={`mt-1 flex items-center justify-end gap-1 text-right text-[9px] ${own ? "text-white/55" : "text-muted-foreground"}`}>
                  {formatMessageTime(message.created_at)}
                  {own ? <MessageReadStatus message={message} reads={messageReads} /> : null}
                </p>
              </div>
            </div>
          );
        }) : <div className="flex h-full flex-col items-center justify-center text-center"><MessageCircle className="size-8 text-blue-vivid/25" aria-hidden /><p className="mt-3 text-sm font-bold text-navy">Start the project conversation</p><p className="mt-1 text-xs text-muted-foreground">Messages are visible only to project participants and admins.</p></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="border-t border-white/70 bg-white/72 p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-white/80 p-2 shadow-soft"><button type="button" disabled aria-label="Attach file" className="grid size-10 shrink-0 place-items-center text-muted-foreground/40"><Paperclip className="size-4" aria-hidden /></button><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Message the project group…" rows={1} maxLength={2000} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-navy outline-none placeholder:text-muted-foreground/60" /><button type="submit" disabled={sending || !value.trim()} aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white shadow-glow transition hover:bg-navy-mid disabled:opacity-40">{sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}</button></div>
      </form>
    </section>
  );
}

function FinanceTab({ data, role, currentUserId, paymentReady, paidTotal, outstandingBuild }: { data: ProjectWorkspaceData; role: WorkspaceRole; currentUserId: string; paymentReady: boolean; paidTotal: number; outstandingBuild: number }) {
  if (role === "talent") {
    const earnings = data.earnings.filter((item) => item.talent_id === currentUserId);
    const owed = earnings.filter((item) => item.status === "owed").reduce((sum, item) => sum + Number(item.amount_owed), 0);
    const paid = earnings.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_owed), 0);
    return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><FinanceMetric label="Total earned" value={formatZar(owed + paid)} icon={CircleDollarSign} dark /><FinanceMetric label="Owed to you" value={formatZar(owed)} icon={Clock3} /><FinanceMetric label="Paid out" value={formatZar(paid)} icon={CheckCircle2} /></div><WorkspaceCard><SectionTitle icon={Banknote} title="Earnings ledger" />{earnings.length ? <div className="space-y-3">{earnings.map((earning) => <div key={earning.id} className="flex flex-col gap-3 rounded-2xl border border-white/75 bg-white/48 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="text-sm font-bold text-navy">{paymentLabel(data.payments.find((payment) => payment.id === earning.payment_id)?.kind)}</p><EarningStatus value={earning.status} /></div><p className="mt-1 text-xs text-muted-foreground">Client paid {formatZar(earning.client_payment_amount)} · Talent pool {formatZar(earning.talent_pool_amount)}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatDate(earning.created_at)}{earning.payout_reference ? ` · ${earning.payout_reference}` : ""}</p></div><p className="font-display text-xl font-bold text-navy">{formatZar(earning.amount_owed)}</p></div>)}</div> : <EmptyFinance text="Your 60% project-share allocations appear here after verified client payments." />}</WorkspaceCard></div>;
  }

  const dueMilestones = data.milestones.filter((item) => item.payment_status === "due" && item.payment_amount > 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3"><FinanceMetric label="Client paid" value={formatZar(paidTotal)} icon={CircleDollarSign} dark /><FinanceMetric label="Build outstanding" value={formatZar(outstandingBuild)} icon={Clock3} /><FinanceMetric label="Talent allocation" value={formatZar(data.earnings.reduce((sum, item) => sum + Number(item.amount_owed), 0))} icon={UsersRound} /></div>
      {role === "client" && dueMilestones.length ? <WorkspaceCard><SectionTitle icon={WalletCards} title="Payments ready" /><div className="space-y-3">{dueMilestones.map((milestone) => <div key={milestone.id} className="flex flex-col gap-3 rounded-2xl border border-accent-amber/15 bg-accent-amber/7 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-navy">{milestone.title}</p><p className="mt-1 text-xs text-muted-foreground">Milestone complete · payment is now due</p></div><form action={prepareWorkspacePayment}><input type="hidden" name="projectId" value={data.project.id} /><input type="hidden" name="kind" value="build_stage" /><input type="hidden" name="milestoneId" value={milestone.id} /><button type="submit" disabled={!paymentReady} className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-glow disabled:opacity-40"><WalletCards className="size-4" aria-hidden /> Pay {formatZar(milestone.payment_amount)}</button></form></div>)}</div></WorkspaceCard> : null}
      {role === "client" && ["monitoring", "delivered"].includes(data.project.status) && Number(data.project.monthly_fee_amount ?? 0) > 0 ? <WorkspaceCard><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-navy">Monthly monitoring and support</p><p className="mt-1 text-xs text-muted-foreground">Keep the delivered system monitored for {formatZar(Number(data.project.monthly_fee_amount))} per month.</p></div><form action={prepareWorkspacePayment}><input type="hidden" name="projectId" value={data.project.id} /><input type="hidden" name="kind" value="monthly" /><button type="submit" disabled={!paymentReady} className="rounded-full bg-blue-vivid px-4 py-2.5 text-xs font-bold text-white shadow-glow disabled:opacity-40">Pay this month</button></form></div></WorkspaceCard> : null}
      <WorkspaceCard><SectionTitle icon={FileText} title="Payment history" />{data.payments.length ? <div className="space-y-3">{data.payments.map((payment) => <div key={payment.id} className="flex flex-col gap-3 rounded-2xl border border-white/75 bg-white/48 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-navy">{payment.description ?? paymentLabel(payment.kind)}</p><PaymentStatus value={payment.status} /></div><p className="mt-1 text-xs text-muted-foreground">{formatDate(payment.paid_at ?? payment.created_at)}{payment.invoice_number ? ` · Invoice ${payment.invoice_number}` : ""}</p></div><div className="flex items-center gap-3"><p className="font-display text-lg font-bold text-navy">{formatZar(payment.amount)}</p>{payment.status === "paid" ? <a href={`/api/paddle/invoice?paymentId=${payment.id}`} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full border border-border bg-white text-navy-mid" aria-label="Open invoice"><Download className="size-4" aria-hidden /></a> : null}</div></div>)}</div> : <EmptyFinance text="Verified project payments will appear here." />}</WorkspaceCard>
      {role === "admin" ? <WorkspaceCard><SectionTitle icon={UsersRound} title="Talent payout control" />{data.earnings.length ? <div className="space-y-3">{data.earnings.map((earning) => <div key={earning.id} className="flex flex-col gap-3 rounded-2xl border border-white/75 bg-white/48 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-navy">{earning.talent_name}</p><EarningStatus value={earning.status} /></div><p className="mt-1 text-xs text-muted-foreground">{earning.share_percent}% allocation · {formatZar(earning.amount_owed)}</p></div>{earning.status === "owed" ? <form action={settleTalentEarning} className="flex items-center gap-2"><input type="hidden" name="projectId" value={data.project.id} /><input type="hidden" name="earningId" value={earning.id} /><input name="reference" placeholder="Payout reference" className="h-9 w-36 rounded-full border border-border bg-white px-3 text-xs outline-none" /><button type="submit" className="rounded-full bg-accent-teal px-3 py-2 text-xs font-bold text-white">Mark paid</button></form> : <p className="text-xs font-semibold text-accent-teal">{earning.payout_reference ?? "Settled"}</p>}</div>)}</div> : <EmptyFinance text="Talent allocations appear after verified payments." />}{data.workspace?.progress_percent === 100 ? <form action={closeProjectWorkspace} className="mt-5 border-t border-white/70 pt-5"><input type="hidden" name="projectId" value={data.project.id} /><button type="submit" className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white"><CheckCircle2 className="size-4" aria-hidden /> Close completed project</button></form> : null}</WorkspaceCard> : null}
    </div>
  );
}

function WorkspaceCard({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`workspace-glass rounded-[1.75rem] p-5 sm:p-6 ${className}`}>{children}</section>; }
function SectionTitle({ icon: Icon, title }: { icon: typeof Sparkles; title: string }) { return <div className="mb-4 flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid"><Icon className="size-4" aria-hidden /></span><h2 className="font-display text-lg font-bold text-navy">{title}</h2></div>; }
function OverviewMetric({ icon: Icon, value, label, tone = "blue" }: { icon: typeof CheckCircle2; value: string; label: string; tone?: "blue" | "teal" }) { return <div className="rounded-2xl bg-white/48 p-4"><span className={`grid size-9 place-items-center rounded-xl ${tone === "teal" ? "bg-accent-teal/10 text-accent-teal" : "bg-blue-vivid/10 text-blue-vivid"}`}><Icon className="size-4" aria-hidden /></span><p className="mt-3 font-display text-2xl font-bold text-navy">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p></div>; }
function FinanceMetric({ label, value, icon: Icon, dark = false }: { label: string; value: string; icon: typeof CircleDollarSign; dark?: boolean }) { return <div className={`rounded-3xl p-5 ${dark ? "talent-glass-dark text-white" : "workspace-glass text-navy"}`}><div className="flex items-center justify-between"><p className={`text-xs font-semibold ${dark ? "text-white/55" : "text-muted-foreground"}`}>{label}</p><Icon className={`size-5 ${dark ? "text-accent-teal" : "text-blue-vivid"}`} aria-hidden /></div><p className="mt-3 font-display text-2xl font-bold">{value}</p></div>; }
function EmptyFinance({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-border bg-white/30 px-5 py-9 text-center"><Banknote className="mx-auto size-6 text-blue-vivid/30" aria-hidden /><p className="mt-3 text-sm text-muted-foreground">{text}</p></div>; }
function MessageReadStatus({ message, reads }: { message: WorkspaceMessage; reads: WorkspaceMessageRead[] }) {
  const readCount = reads.filter(
    (read) => read.user_id !== message.sender_id && new Date(read.last_read_at) >= new Date(message.created_at)
  ).length;
  return readCount > 0 ? (
    <span className="inline-flex items-center gap-0.5 text-blue-sky" title={`Read by ${readCount} project participant${readCount === 1 ? "" : "s"}`}>
      <CheckCheck className="size-3" aria-hidden /> Read
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5" title="Delivered">
      <Check className="size-3" aria-hidden /> Delivered
    </span>
  );
}
function WorkspaceStatus({ value }: { value: string }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/12 px-3 py-1 text-[10px] font-bold capitalize text-accent-teal"><span className="talent-live-dot size-1.5 rounded-full bg-accent-teal" />{value.replaceAll("_", " ")}</span>; }
function MilestoneStatus({ value }: { value: string }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${value === "completed" ? "bg-accent-teal/10 text-accent-teal" : value === "in_progress" ? "bg-blue-vivid/10 text-blue-vivid" : "bg-blue-light text-navy-mid"}`}>{value.replaceAll("_", " ")}</span>; }
function PaymentStatus({ value }: { value: string }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${value === "paid" ? "bg-accent-teal/10 text-accent-teal" : value === "failed" ? "bg-danger/10 text-danger" : "bg-accent-amber/10 text-accent-amber"}`}>{value}</span>; }
function EarningStatus({ value }: { value: string }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${value === "paid" ? "bg-accent-teal/10 text-accent-teal" : value === "owed" ? "bg-accent-amber/10 text-accent-amber" : "bg-blue-light text-navy-mid"}`}>{value}</span>; }
function formatZar(value: number) { return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(Number(value) || 0); }
function formatDate(value: string | null) { if (!value) return "Date pending"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date pending" : new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(date); }
function formatMessageTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "now" : new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit" }).format(date); }
function getDaysRemaining(value: string | null | undefined) { if (!value) return null; return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000)); }
function initials(value: string | null) { if (!value) return "SA"; return value.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function paymentLabel(kind: string | undefined) { if (kind === "deposit") return "Project deposit"; if (kind === "monthly") return "Monthly support"; if (kind === "delivery") return "Delivery payment"; return "Build milestone"; }
