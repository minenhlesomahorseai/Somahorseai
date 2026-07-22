"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  FolderKanban,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { sendWorkspaceMessage } from "@/app/dashboard/project-workspace-actions";
import type { ClientMessageThread } from "@/lib/dashboard/client-workspace-data";
import type { WorkspaceMessage, WorkspaceMessageRead } from "@/lib/projects/workspace";
import { createClient } from "@/lib/supabase/client";

export function ProjectMessages({
  initialThreads,
  currentUserId,
  initialProjectId,
  viewerRole,
}: {
  initialThreads: ClientMessageThread[];
  currentUserId: string;
  initialProjectId: string | null;
  viewerRole: "client" | "talent";
}) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const activeThread = threads.find((thread) => thread.projectId === activeProjectId) ?? null;
  const dashboardBase = `/dashboard/${viewerRole}`;
  const projectIds = useMemo(() => new Set(initialThreads.map((thread) => thread.projectId)), [initialThreads]);
  const nameById = useMemo(
    () => new Map(initialThreads.flatMap((thread) => thread.members.map((member) => [member.id, member.fullName] as const))),
    [initialThreads]
  );

  useEffect(() => {
    const client = createClient();
    const channel = client
      .channel(`client-project-inbox:${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages" }, (payload) => {
        const incoming = payload.new as Omit<WorkspaceMessage, "sender_name">;
        if (!projectIds.has(incoming.project_id)) return;
        const message: WorkspaceMessage = {
          ...incoming,
          sender_name:
            incoming.sender_role === "admin"
              ? "Somahorse control room"
              : nameById.get(incoming.sender_id) ?? (incoming.sender_id === currentUserId ? "You" : "Project developer"),
        };
        setThreads((current) =>
          current.map((thread) =>
            thread.projectId === incoming.project_id && !thread.messages.some((item) => item.id === incoming.id)
              ? { ...thread, messages: [...thread.messages, message] }
              : thread
          )
        );
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_message_reads" }, (payload) => {
        const incoming = payload.new as WorkspaceMessageRead;
        if (!incoming?.project_id || !projectIds.has(incoming.project_id)) return;
        setThreads((current) =>
          current.map((thread) =>
            thread.projectId === incoming.project_id
              ? { ...thread, reads: [...thread.reads.filter((read) => read.user_id !== incoming.user_id), incoming] }
              : thread
          )
        );
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [currentUserId, nameById, projectIds]);

  useEffect(() => {
    if (!activeThread?.messages.length) return;
    endRef.current?.scrollIntoView({ block: "end" });
    const latestMessageAt = activeThread.messages.at(-1)?.created_at;
    const ownRead = activeThread.reads.find((read) => read.user_id === currentUserId)?.last_read_at;
    if (!latestMessageAt || (ownRead && new Date(ownRead) >= new Date(latestMessageAt))) return;
    const readAt = new Date().toISOString();
    const read: WorkspaceMessageRead = {
      project_id: activeThread.projectId,
      user_id: currentUserId,
      last_read_at: readAt,
      updated_at: readAt,
    };
    const client = createClient();
    void client
      .from("project_message_reads")
      .upsert(
        { project_id: activeThread.projectId, user_id: currentUserId, last_read_at: readAt },
        { onConflict: "project_id,user_id" }
      )
      .then(({ error }) => {
        if (error) return;
        setThreads((current) => current.map((thread) => thread.projectId === activeThread.projectId ? { ...thread, reads: [...thread.reads.filter((item) => item.user_id !== currentUserId), read] } : thread));
      });
    void client.from("notifications").update({ read_at: readAt }).eq("project_id", activeThread.projectId).eq("type", "project_message").is("read_at", null);
  }, [activeThread, currentUserId]);

  const selectThread = (projectId: string) => {
    setActiveProjectId(projectId);
    setError(null);
    router.replace(`${dashboardBase}/messages?project=${projectId}`, { scroll: false });
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = messageText.trim();
    if (!body || !activeThread) return;
    setError(null);
    startSending(async () => {
      const result = await sendWorkspaceMessage(activeThread.projectId, body);
      if (!result.ok || !result.message) {
        setError(result.error ?? "Message could not be sent");
        return;
      }
      setThreads((current) => current.map((thread) => thread.projectId === activeThread.projectId && !thread.messages.some((message) => message.id === result.message!.id) ? { ...thread, messages: [...thread.messages, result.message!] } : thread));
      setMessageText("");
    });
  };

  if (!threads.length) {
    return (
      <div className="space-y-6">
        <MessagesHeader viewerRole={viewerRole} />
        <section className="workspace-glass flex min-h-[28rem] flex-col items-center justify-center rounded-[2rem] px-6 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-blue-vivid/10 text-blue-vivid"><MessagesSquare className="size-7" aria-hidden /></span>
          <h2 className="mt-5 font-display text-2xl font-bold text-navy">No project conversations yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Your secure group chat opens when you join an active project workspace.</p>
          <Link href={`${dashboardBase}/projects`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-glow">View projects <ArrowUpRight className="size-4" aria-hidden /></Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <MessagesHeader viewerRole={viewerRole} />
      <section className="workspace-chat min-w-0 overflow-hidden rounded-[2rem] border border-white/75 shadow-elevated lg:grid lg:h-[calc(100vh-11.5rem)] lg:min-h-[38rem] lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="border-b border-border/60 bg-white/62 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <div className="mb-3 hidden items-center justify-between px-1 lg:flex"><div><p className="font-display text-lg font-bold text-navy">Projects</p><p className="text-[10px] text-muted-foreground">Choose a secure group</p></div><span className="grid size-8 place-items-center rounded-full bg-blue-vivid/10 text-blue-vivid"><FolderKanban className="size-4" aria-hidden /></span></div>
          <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto lg:block lg:max-h-[calc(100vh-17rem)] lg:space-y-1.5 lg:overflow-y-auto">
            {threads.map((thread) => {
              const selected = thread.projectId === activeProjectId;
              const unread = threadUnread(thread, currentUserId);
              const lastMessage = thread.messages.at(-1);
              return (
                <button key={thread.projectId} type="button" onClick={() => selectThread(thread.projectId)} className={`relative min-w-[12rem] snap-start rounded-2xl p-3 text-left transition lg:block lg:w-full lg:min-w-0 ${selected ? "bg-navy text-white shadow-glow" : "bg-white/65 text-navy hover:bg-blue-light/55"}`}>
                  <div className="flex items-center gap-2.5"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${selected ? "bg-white/12 text-accent-teal" : "bg-blue-vivid/10 text-blue-vivid"}`}><UsersRound className="size-4" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{thread.projectTitle}</span><span className={`mt-0.5 block truncate text-[10px] ${selected ? "text-white/55" : "text-muted-foreground"}`}>{thread.members.length ? thread.members.map((member) => firstName(member.fullName)).join(", ") : "Project group"}</span></span>{unread ? <span className="grid min-w-5 place-items-center rounded-full bg-accent-amber px-1 text-[9px] font-bold leading-5 text-white">{unread > 9 ? "9+" : unread}</span> : null}</div>
                  <p className={`mt-2 truncate text-[10px] ${selected ? "text-white/48" : "text-muted-foreground"}`}>{lastMessage ? `${lastMessage.sender_id === currentUserId ? "You" : firstName(lastMessage.sender_name)}: ${lastMessage.body}` : "No messages yet"}</p>
                </button>
              );
            })}
          </div>
        </aside>

        {activeThread ? (
          <div className="flex min-h-[34rem] min-w-0 flex-col lg:min-h-0">
            <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-white/78 px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3"><span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-vivid text-white"><UsersRound className="size-5" aria-hidden /><span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-accent-teal" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-navy">{activeThread.projectTitle}</p><p className="truncate text-[10px] text-muted-foreground">{activeThread.members.filter((member) => member.id !== currentUserId).length} other project {activeThread.members.filter((member) => member.id !== currentUserId).length === 1 ? "participant" : "participants"} · Somahorse support</p></div></div>
              <Link href={`${dashboardBase}/projects/${activeThread.projectId}`} className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white text-navy-mid" aria-label="Open project workspace"><ArrowUpRight className="size-4" aria-hidden /></Link>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(239,246,255,.55),rgba(255,255,255,.72))] p-4 sm:p-6">
              {activeThread.messages.length ? activeThread.messages.map((message) => {
                const own = message.sender_id === currentUserId;
                const admin = message.sender_role === "admin";
                return (
                  <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-soft sm:max-w-[72%] ${own ? "rounded-br-md bg-navy text-white" : admin ? "rounded-bl-md border border-accent-teal/15 bg-accent-teal/8 text-navy" : "rounded-bl-md border border-white bg-white/92 text-navy"}`}>
                      {!own ? <p className={`mb-1 text-[10px] font-bold ${admin ? "text-accent-teal" : "text-blue-vivid"}`}>{message.sender_name}</p> : null}
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${own ? "text-white/55" : "text-muted-foreground"}`}>{formatMessageTime(message.created_at)}{own ? <ReadStatus message={message} reads={activeThread.reads} /> : null}</p>
                    </div>
                  </div>
                );
              }) : <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><MessageCircle className="size-8 text-blue-vivid/25" aria-hidden /><p className="mt-3 text-sm font-bold text-navy">Start the project conversation</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{viewerRole === "talent" ? "Share an update, ask the client a question, or coordinate with your teammates." : "Ask the developers about progress, decisions, or anything you need explained."}</p></div>}
              <div ref={endRef} />
            </div>

            {error ? <p className="border-t border-accent-amber/15 bg-accent-amber/8 px-4 py-2 text-xs text-accent-amber" role="alert">{error}</p> : null}
            <form onSubmit={submitMessage} className="border-t border-border/60 bg-white/85 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-1.5 px-1 text-[9px] font-semibold text-accent-teal"><LockKeyhole className="size-3" aria-hidden /> Only this project&apos;s client, assigned talent, and Somahorse admins can read this chat.</div>
              <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-white p-2 shadow-soft"><textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={viewerRole === "talent" ? "Reply to the project group…" : "Write to your project team…"} rows={1} maxLength={2000} className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-navy outline-none placeholder:text-muted-foreground/60" /><button type="submit" disabled={sending || !messageText.trim()} aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white shadow-glow transition hover:bg-navy-mid disabled:opacity-40">{sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}</button></div>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MessagesHeader({ viewerRole }: { viewerRole: "client" | "talent" }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="cue text-navy-mid/70">Secure project inbox</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">Messages</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{viewerRole === "talent" ? "Talk to clients, teammates, and Somahorse support across your assigned projects. Messages and read receipts update instantly." : "Talk to the certified developers on each of your projects. Messages and read receipts update instantly."}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-teal/15 bg-white/70 px-3.5 py-2 text-[10px] font-bold text-accent-teal shadow-soft"><ShieldCheck className="size-4" aria-hidden /> Participant-only</span></div>;
}

function ReadStatus({ message, reads }: { message: WorkspaceMessage; reads: WorkspaceMessageRead[] }) {
  const count = reads.filter((read) => read.user_id !== message.sender_id && new Date(read.last_read_at) >= new Date(message.created_at)).length;
  return count ? <span className="inline-flex items-center gap-0.5 text-blue-sky" title={`Read by ${count}`}><CheckCheck className="size-3" aria-hidden /> Read</span> : <span className="inline-flex items-center gap-0.5" title="Delivered"><Check className="size-3" aria-hidden /> Delivered</span>;
}

function threadUnread(thread: ClientMessageThread, currentUserId: string) {
  const lastRead = thread.reads.find((read) => read.user_id === currentUserId)?.last_read_at;
  return thread.messages.filter((message) => message.sender_id !== currentUserId && (!lastRead || new Date(message.created_at) > new Date(lastRead))).length;
}

function firstName(value: string) { return value.trim().split(/\s+/)[0] ?? value; }
function formatMessageTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "now" : new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit" }).format(date); }
