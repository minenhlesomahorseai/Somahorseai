"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CornerDownLeft,
  CreditCard,
  History,
  Layers3,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

import type { ClientContext } from "@/lib/dashboard/types";
import { formatZar } from "@/lib/projects/pricing";
import { formatMoney } from "@/lib/currency/config";
import type {
  IntakeConversation,
  ProjectProposal,
  ProposedTeam,
  ProposedTeamMember,
} from "@/lib/projects/types";

import { prepareProjectCheckout } from "./actions";

const EASE = [0.16, 1, 0.3, 1] as const;

type IntakeRole = "user" | "assistant";

interface IntakeMessage {
  id: string;
  role: IntakeRole;
  content: string;
  created_at?: string;
}

interface IntakeResponse {
  conversation: IntakeConversation;
  messages: IntakeMessage[];
}

function temporaryId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function resultFromConversation(conversation: IntakeConversation | null): ProposedTeam | null {
  if (!conversation || !conversation.match_rationale) return null;
  return {
    rationale: conversation.match_rationale,
    team: conversation.proposed_team,
  };
}

export function ProjectIntakeChat({
  context,
  aiReady,
  paymentsReady,
  initialConversation,
  initialConversations,
  initialMessages,
  displayCurrency,
  displayRate,
}: {
  context: ClientContext;
  aiReady: boolean;
  paymentsReady: boolean;
  initialConversation: IntakeConversation | null;
  initialConversations: IntakeConversation[];
  initialMessages: IntakeMessage[];
  displayCurrency: string;
  displayRate: number;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<IntakeMessage[]>(initialMessages);
  const [conversation, setConversation] = useState<IntakeConversation | null>(
    initialConversation
  );
  const [conversations, setConversations] = useState<IntakeConversation[]>(
    initialConversations
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(
    Boolean(initialConversation?.proposal)
  );
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<ProposedTeam | null>(
    resultFromConversation(initialConversation)
  );
  const [startingProject, setStartingProject] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const displayMoney = (amountZar: number) =>
    displayCurrency === "ZAR"
      ? formatZar(amountZar)
      : formatMoney(amountZar * displayRate, displayCurrency, {
          maximumFractionDigits: 0,
        });

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    setMessages((current) => {
      const lastIndex = current.length - 1;
      if (lastIndex < 0 || current[lastIndex].role !== "assistant") return current;
      const next = [...current];
      next[lastIndex] = { ...next[lastIndex], content };
      return next;
    });
  }, []);

  const recordConversation = useCallback((nextConversation: IntakeConversation) => {
    setConversations((current) => [
      nextConversation,
      ...current.filter((item) => item.id !== nextConversation.id),
    ].slice(0, 12));
  }, []);

  const fetchConversation = useCallback(async (id: string): Promise<IntakeResponse> => {
    const response = await fetch(
      `/api/projects/intake?conversationId=${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );
    const data = (await response.json()) as IntakeResponse & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Could not load that conversation.");
    return data;
  }, []);

  const fetchTeam = useCallback(async (id: string) => {
    setMatchLoading(true);
    setMatchError(null);
    try {
      const response = await fetch("/api/projects/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      const data = (await response.json()) as ProposedTeam & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Matching failed.");
      setMatchResult(data);
      setConversation((current) =>
        current?.id === id
          ? {
              ...current,
              proposed_team: data.team,
              match_rationale: data.rationale,
            }
          : current
      );
    } catch (cause) {
      setMatchError(cause instanceof Error ? cause.message : "Matching failed.");
    } finally {
      setMatchLoading(false);
    }
  }, []);

  const applyConversation = useCallback(
    (data: IntakeResponse, { openProposal = false }: { openProposal?: boolean } = {}) => {
      setConversation(data.conversation);
      setMessages(data.messages);
      recordConversation(data.conversation);
      const storedTeam = resultFromConversation(data.conversation);
      setMatchResult(storedTeam);
      if (data.conversation.proposal && openProposal) {
        setPanelOpen(true);
        if (!storedTeam && data.conversation.stage === "proposal_ready") {
          void fetchTeam(data.conversation.id);
        }
      }
      scrollToBottom();
    },
    [fetchTeam, recordConversation, scrollToBottom]
  );

  const streamReply = useCallback(
    async ({
      content,
      start = false,
      conversationIdOverride,
    }: {
      content?: string;
      start?: boolean;
      conversationIdOverride?: string | null;
    }) => {
      const text = content?.trim() ?? "";
      if (!text && !start) return;

      setStreaming(true);
      setError(null);
      setStartError(null);
      if (text) {
        setMatchResult(null);
        setMatchError(null);
      }
      setMessages((current) => [
        ...current,
        ...(text
          ? [
              {
                id: temporaryId(),
                role: "user" as const,
                content: text,
                created_at: new Date().toISOString(),
              },
            ]
          : []),
        { id: temporaryId(), role: "assistant" as const, content: "" },
      ]);
      scrollToBottom();

      let assistantText = "";
      let activeConversationId =
        conversationIdOverride === undefined ? conversation?.id ?? null : conversationIdOverride;
      try {
        const response = await fetch("/api/projects/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConversationId,
            content: text || undefined,
            start,
          }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "The intake agent is unavailable right now.");
        }

        activeConversationId = response.headers.get("X-Intake-Conversation-Id");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          updateLastAssistant(assistantText);
          scrollToBottom();
        }
        assistantText += decoder.decode();
        if (assistantText) updateLastAssistant(assistantText);

        if (activeConversationId) {
          const saved = await fetchConversation(activeConversationId);
          applyConversation(saved, { openProposal: true });
        }
      } catch (cause) {
        setMessages((current) => {
          const lastIndex = current.length - 1;
          if (lastIndex < 0 || current[lastIndex].role !== "assistant") return current;
          if (assistantText) {
            const next = [...current];
            next[lastIndex] = { ...next[lastIndex], content: assistantText };
            return next;
          }
          return current.slice(0, -1);
        });
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
      } finally {
        setStreaming(false);
        scrollToBottom();
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [applyConversation, conversation?.id, fetchConversation, scrollToBottom, updateLastAssistant]
  );

  useEffect(() => {
    if (startedRef.current || !aiReady || messages.length > 0 || initialConversation) return;
    startedRef.current = true;
    void streamReply({ start: true, conversationIdOverride: null });
  }, [aiReady, initialConversation, messages.length, streamReply]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming || !aiReady || conversation?.stage === "checkout") return;
    setInput("");
    void streamReply({ content: text });
  };

  const startNewConversation = () => {
    if (streaming || !aiReady) return;
    startedRef.current = true;
    setHistoryOpen(false);
    setConversation(null);
    setMessages([]);
    setInput("");
    setError(null);
    setMatchResult(null);
    setMatchError(null);
    setPanelOpen(false);
    void streamReply({ start: true, conversationIdOverride: null });
  };

  const openConversation = async (id: string) => {
    if (streaming || id === conversation?.id) {
      setHistoryOpen(false);
      return;
    }
    setHistoryLoading(true);
    setError(null);
    try {
      const data = await fetchConversation(id);
      applyConversation(data);
      setHistoryOpen(false);
      setPanelOpen(Boolean(data.conversation.proposal));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load that conversation.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openProposal = () => {
    if (!conversation?.proposal) return;
    setPanelOpen(true);
    if (!matchResult && !matchLoading && conversation.stage === "proposal_ready") {
      void fetchTeam(conversation.id);
    }
  };

  const handleStartProject = async () => {
    if (!conversation || startingProject) return;
    setStartingProject(true);
    setStartError(null);
    const result = await prepareProjectCheckout(conversation.id);
    if (!result.ok || !result.checkoutPath) {
      setStartError(result.error ?? "Could not prepare checkout.");
      setStartingProject(false);
      return;
    }
    router.push(result.checkoutPath);
  };

  const proposal = conversation?.proposal ?? null;
  const intakeLocked = conversation?.stage === "checkout" || conversation?.stage === "converted";

  return (
    <div className="intake-field flex h-[100dvh] flex-col overflow-hidden text-navy">
      <header className="relative z-30 flex shrink-0 items-center justify-between border-b border-white/50 bg-white/55 px-4 py-3 backdrop-blur-2xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/client"
            aria-label="Back to dashboard"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-navy-mid shadow-soft transition hover:-translate-y-0.5 hover:bg-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-white/20 bg-navy text-white shadow-glow">
              <Bot className="size-5" aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-accent-teal shadow-[0_0_10px_rgba(38,180,162,0.8)]" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="font-display text-sm font-bold text-navy">Project scoping</p>
              <p className="truncate text-xs text-muted-foreground">
                {proposal
                  ? "Scope complete · proposal saved"
                  : `Question ${Math.max(1, conversation?.question_count ?? 1)} of up to 10${context.companyName ? ` · ${context.companyName}` : ""}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              disabled={streaming}
              aria-expanded={historyOpen}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/80 bg-white/65 px-3 text-xs font-semibold text-navy-mid shadow-soft transition hover:bg-white disabled:opacity-50"
            >
              <History className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">History</span>
              <ChevronDown className="size-3" aria-hidden />
            </button>
            <AnimatePresence>
              {historyOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-2 shadow-elevated backdrop-blur-2xl"
                >
                  <p className="px-2 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Saved project intakes
                  </p>
                  {conversations.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      Your saved conversations will appear here.
                    </p>
                  ) : (
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {conversations.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void openConversation(item.id)}
                          disabled={historyLoading}
                          className={`w-full rounded-xl px-3 py-2 text-left transition hover:bg-blue-light/75 disabled:opacity-60 ${
                            item.id === conversation?.id ? "bg-blue-light/70" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-navy">{item.title}</p>
                            {item.proposal ? (
                              <span className="shrink-0 rounded-full bg-accent-teal/12 px-2 py-0.5 text-[10px] font-bold text-accent-teal">
                                Scoped
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock3 className="size-3" aria-hidden /> {formatConversationDate(item.updated_at)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            disabled={streaming || !aiReady}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy-mid px-3 text-xs font-semibold text-white shadow-glow transition hover:bg-navy disabled:opacity-50"
          >
            <MessageSquarePlus className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">New chat</span>
          </button>
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={30}
            height={30}
            className="hidden size-8 rounded-full object-contain sm:block"
            priority
          />
        </div>
      </header>

      <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {!aiReady ? <AiNotReady /> : null}

          {messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}

          {streaming && messages[messages.length - 1]?.content === "" ? (
            <div className="flex items-center gap-2.5" aria-live="polite">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-navy text-white shadow-soft">
                <Bot className="size-4" aria-hidden />
              </span>
              <div className="intake-glass rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-muted-foreground">
                <TypingDots />
              </div>
            </div>
          ) : null}

          {proposal ? (
            <motion.button
              type="button"
              onClick={openProposal}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group ml-10 overflow-hidden rounded-3xl border border-blue-vivid/20 bg-white/80 text-left shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-accent-teal">
                    <CheckCircle2 className="size-3.5" aria-hidden /> Scope complete
                  </span>
                  <h2 className="mt-3 font-display text-xl font-bold text-navy">{proposal.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {proposal.summary}
                  </p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy text-white shadow-glow transition group-hover:scale-105">
                  <Sparkles className="size-5" aria-hidden />
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 bg-blue-light/25 px-5 py-3 text-xs font-semibold text-navy-mid">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> {proposal.timelineWeeks} weeks
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="size-3.5" /> {displayMoney(proposal.buildFeeZar)} build
                </span>
                <span className="ml-auto text-blue-vivid">Open proposal →</span>
              </div>
            </motion.button>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-3 text-sm text-accent-amber" role="alert">
              {error}
            </div>
          ) : null}
        </div>
      </main>

      <div className="relative z-10 shrink-0 border-t border-white/55 bg-white/48 px-4 py-3 backdrop-blur-2xl sm:px-6 sm:py-4">
        <div className="mx-auto max-w-3xl">
          {proposal ? (
            <div className="intake-glass mb-3 flex flex-col gap-2 rounded-2xl px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-navy-mid">
                Your proposal and every answer are saved. Review the solution, team, timeline, and investment.
              </p>
              <button
                type="button"
                onClick={openProposal}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-navy-mid px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-navy"
              >
                <Layers3 className="size-3.5" aria-hidden /> Review proposal
              </button>
            </div>
          ) : null}

          <div className="intake-glass flex items-end gap-2 rounded-3xl p-2 shadow-card focus-within:border-blue-vivid/55">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              maxLength={8_000}
              disabled={!aiReady || streaming || intakeLocked}
              placeholder={
                intakeLocked
                  ? "This scope is locked for checkout"
                  : streaming
                    ? "The agent is working through your answer..."
                    : proposal
                      ? "Ask for a change to the scope..."
                      : "Describe the problem, or answer the next question..."
              }
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-navy placeholder-muted-foreground/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || streaming || !aiReady || intakeLocked}
              aria-label="Send message"
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy-mid to-blue-vivid text-white shadow-glow transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {streaming ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CornerDownLeft className="size-4" aria-hidden />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Every answer and the agent&apos;s evolving understanding are saved securely.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {panelOpen && proposal ? (
          <ProposalPanel
            proposal={proposal}
            matchResult={matchResult}
            matchLoading={matchLoading}
            matchError={matchError}
            paymentsReady={paymentsReady}
            startingProject={startingProject}
            startError={startError}
            projectPrepared={conversation?.stage === "checkout"}
            projectStarted={conversation?.stage === "converted"}
            displayMoney={displayMoney}
            onClose={() => setPanelOpen(false)}
            onRetryMatch={() => conversation && void fetchTeam(conversation.id)}
            onStart={() => void handleStartProject()}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProposalPanel({
  proposal,
  matchResult,
  matchLoading,
  matchError,
  paymentsReady,
  startingProject,
  startError,
  projectPrepared,
  projectStarted,
  displayMoney,
  onClose,
  onRetryMatch,
  onStart,
}: {
  proposal: ProjectProposal;
  matchResult: ProposedTeam | null;
  matchLoading: boolean;
  matchError: string | null;
  paymentsReady: boolean;
  startingProject: boolean;
  startError: string | null;
  projectPrepared: boolean;
  projectStarted: boolean;
  displayMoney: (amountZar: number) => string;
  onClose: () => void;
  onRetryMatch: () => void;
  onStart: () => void;
}) {
  const teamReady = Boolean(matchResult?.team.length);
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.34, ease: EASE }}
        aria-label="Project proposal"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-white/60 bg-blue-mist/95 shadow-elevated backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-white/65 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-navy text-white shadow-glow">
              <Sparkles className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-vivid">
                Somahorse proposal
              </p>
              <h2 className="font-display text-base font-bold text-navy sm:text-lg">{proposal.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close proposal"
            className="grid size-9 place-items-center rounded-full border border-border bg-white/80 text-navy-mid transition hover:bg-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="space-y-6">
            <section className="rounded-3xl bg-navy p-5 text-white shadow-glow sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">The problem</p>
              <p className="mt-2 text-base leading-relaxed text-white/90">{proposal.problem}</p>
              <div className="mt-4 border-t border-white/12 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200">The outcome</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">{proposal.outcome}</p>
              </div>
            </section>

            <section>
              <SectionLabel>Recommended solution</SectionLabel>
              <div className="intake-glass mt-2 rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-navy">{proposal.solutionName}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.09em] text-blue-vivid">
                      {formatDeliveryFormat(proposal.deliveryFormat)}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-teal/12 px-3 py-1 text-xs font-bold text-accent-teal">
                    {proposal.timelineWeeks} weeks to launch
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{proposal.approach}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {proposal.components.map((component) => (
                    <div key={component} className="flex items-start gap-2 rounded-2xl bg-white/65 px-3 py-2.5 text-sm text-navy-mid">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-accent-teal" aria-hidden />
                      {component}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <SectionLabel>Delivery plan</SectionLabel>
              <div className="mt-3 space-y-2">
                {proposal.milestones.map((milestone, index) => (
                  <div key={`${milestone.title}-${index}`} className="flex gap-3 rounded-2xl border border-white/70 bg-white/65 p-4 shadow-soft">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-light text-xs font-bold text-navy-mid">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-navy">{milestone.title}</p>
                        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                          {milestone.durationWeeks} {milestone.durationWeeks === 1 ? "week" : "weeks"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <SectionLabel>Your proposed team</SectionLabel>
                  <p className="mt-1 text-xs text-muted-foreground">Certified and unallocated at the time of matching.</p>
                </div>
                {matchError ? (
                  <button type="button" onClick={onRetryMatch} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-vivid">
                    <RefreshCw className="size-3" /> Retry
                  </button>
                ) : null}
              </div>
              {matchLoading ? (
                <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/55 py-10 text-center">
                  <Loader2 className="size-6 animate-spin text-navy-mid" aria-hidden />
                  <p className="text-sm text-muted-foreground">Scoring the currently available specialists…</p>
                </div>
              ) : matchError ? (
                <div className="mt-3 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-4 text-sm text-accent-amber">
                  {matchError}
                </div>
              ) : matchResult ? (
                <div className="mt-3 space-y-3">
                  <p className="flex items-start gap-2 rounded-2xl bg-blue-light/55 p-3 text-sm leading-relaxed text-navy-mid">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-vivid" aria-hidden />
                    {matchResult.rationale}
                  </p>
                  {matchResult.team.length ? (
                    matchResult.team.map((member) => <TalentCard key={member.id} member={member} />)
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border bg-white/55 p-5 text-center text-sm text-muted-foreground">
                      No certified specialist is unallocated right now. The project cannot take payment until an available team is nominated.
                    </p>
                  )}
                </div>
              ) : null}
            </section>

            <section>
              <SectionLabel>Investment</SectionLabel>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <PriceCard icon={Wallet} label="Fixed build fee" value={displayMoney(proposal.buildFeeZar)} />
                <PriceCard icon={CalendarDays} label="Delivery" value={`${proposal.timelineWeeks} weeks`} />
                <PriceCard icon={CreditCard} label="Deposit today" value={displayMoney(proposal.depositZar)} accent />
                <PriceCard icon={ShieldCheck} label="Monthly after launch" value={displayMoney(proposal.monthlyFeeZar)} suffix="/ month" />
              </div>
              <div className="mt-3 rounded-2xl border border-border/70 bg-white/60 p-4 text-xs leading-relaxed text-muted-foreground">
                The deposit starts delivery. The remaining build fee is staged across the build and launch. Monthly monitoring and support begin when the solution goes live.
              </div>
            </section>
          </div>
        </div>

        <div className="border-t border-border/60 bg-white/75 px-5 py-4 backdrop-blur-xl sm:px-7">
          {startError ? <p className="mb-2 text-xs font-medium text-accent-amber" role="alert">{startError}</p> : null}
          {!paymentsReady ? (
            <p className="mb-2 rounded-xl bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber">
              Paddle keys must be configured before this button can take a live payment.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onStart}
            disabled={
              matchLoading ||
              startingProject ||
              !teamReady ||
              !paymentsReady ||
              projectStarted
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-mid px-5 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {startingProject ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : projectStarted ? (
              <CheckCircle2 className="size-4" aria-hidden />
            ) : (
              <CreditCard className="size-4" aria-hidden />
            )}
            {startingProject
              ? "Preparing secure checkout…"
              : projectStarted
                ? "Project started"
                : projectPrepared
                  ? "Continue to secure payment"
                  : `Start project · Pay ${displayMoney(proposal.depositZar)} deposit`}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Secure payment by Paddle. Talent is alerted only after payment is verified.
          </p>
        </div>
      </motion.aside>
    </>
  );
}

function TalentCard({ member }: { member: ProposedTeamMember }) {
  const initials = member.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="intake-glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy to-blue-vivid text-xs font-bold text-white shadow-soft">
          {initials || <UsersRound className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-display text-sm font-bold text-navy">{member.name}</p>
            <span className="shrink-0 rounded-full bg-accent-teal/12 px-2.5 py-0.5 text-xs font-bold text-accent-teal">
              {member.matchScore}% fit
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-navy-mid">{member.role}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{member.reason}</p>
        </div>
      </div>
    </div>
  );
}

function PriceCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent = false,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-blue-vivid/25 bg-blue-light/70" : "border-white/70 bg-white/70"}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="size-3.5 text-navy-mid" /> {label}
      </div>
      <p className="mt-2 font-display text-lg font-bold text-navy sm:text-xl">
        {value}{suffix ? <span className="ml-1 text-[10px] font-medium text-muted-foreground">{suffix}</span> : null}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy-mid/65">{children}</p>
  );
}

function MessageBubble({ role, content }: { role: IntakeRole; content: string }) {
  const isUser = role === "user";
  if (!content) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-soft ${isUser ? "border border-white/70 bg-blue-light/80 text-navy-mid" : "bg-navy text-white"}`}>
        {isUser ? "You" : <Bot className="size-4" aria-hidden />}
      </span>
      <div className={`max-w-[86%] px-4 py-3 text-sm leading-relaxed shadow-soft sm:max-w-[78%] ${isUser ? "rounded-2xl rounded-tr-sm border border-white/15 bg-gradient-to-br from-navy-mid/95 to-blue-vivid/85 text-white backdrop-blur-xl" : "intake-glass rounded-2xl rounded-tl-sm text-navy"}`}>
        <RichText text={content} muted={!isUser} />
      </div>
    </motion.div>
  );
}

function RichText({ text, muted }: { text: string; muted: boolean }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1.5" />;
        const isBullet = /^[-*•]\s+/.test(trimmed);
        const body = isBullet ? trimmed.replace(/^[-*•]\s+/, "") : trimmed;
        return (
          <p key={index} className={isBullet ? "flex gap-2" : ""}>
            {isBullet ? <span className={muted ? "text-blue-vivid" : "text-white/80"}>•</span> : null}
            <span>{renderInline(body)}</span>
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-label="The agent is thinking">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1.5 rounded-full bg-navy-mid/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
        />
      ))}
    </span>
  );
}

function formatDeliveryFormat(value: ProjectProposal["deliveryFormat"]) {
  return value.replaceAll("_", " ");
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved conversation";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function AiNotReady() {
  return (
    <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-4 text-sm text-accent-amber">
      The AI intake agent is not configured yet. Add a <code className="font-mono">GEMINI_API_KEY</code> to enable the conversation.
    </div>
  );
}
