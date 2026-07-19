"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CornerDownLeft,
  Loader2,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import type { ChatMessage } from "@/lib/ai/provider";
import type { MatchResult } from "@/lib/ai/agents";
import type { ClientContext } from "@/lib/dashboard/types";

import { createProject } from "./actions";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ProjectIntakeChat({
  context,
  aiReady,
}: {
  context: ClientContext;
  aiReady: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const streamReply = useCallback(
    async (history: ChatMessage[]) => {
      setStreaming(true);
      setError(null);
      setMessages([...history, { role: "assistant", content: "" }]);
      scrollToBottom();

      try {
        const res = await fetch("/api/projects/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "The intake agent is unavailable right now.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages([...history, { role: "assistant", content: acc }]);
          scrollToBottom();
        }
      } catch (e) {
        setMessages(history);
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setStreaming(false);
        scrollToBottom();
      }
    },
    [scrollToBottom]
  );

  // Proactive greeting on first open.
  useEffect(() => {
    if (startedRef.current || !aiReady) return;
    startedRef.current = true;
    void streamReply([]);
  }, [aiReady, streamReply]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    void streamReply([...messages, { role: "user", content: text }]);
  };

  const buildScope = () =>
    messages
      .map((m) => `${m.role === "user" ? "Client" : "Agent"}: ${m.content}`)
      .join("\n\n");

  const openMatching = async () => {
    setPanelOpen(true);
    setMatchLoading(true);
    setMatchError(null);
    setMatchResult(null);
    try {
      const res = await fetch("/api/projects/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: buildScope() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Matching failed.");
      setMatchResult(data as MatchResult);
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "Matching failed.");
    } finally {
      setMatchLoading(false);
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    const firstUser = messages.find((m) => m.role === "user")?.content ?? "";
    const title =
      firstUser.slice(0, 70) ||
      `${context.companyName ?? "New"} project`;
    const summary = matchResult?.rationale ?? firstUser.slice(0, 200);
    const result = await createProject({
      title,
      summary,
      scope: buildScope(),
      sector: context.sector,
      budget_range: context.budgetRange,
      timeline: context.timeline,
      matched_team: matchResult?.team.map((t) => t.id) ?? [],
    });
    if (!result.ok) {
      setCreateError(result.error ?? "Could not create project.");
      setCreating(false);
      return;
    }
    router.push("/dashboard/client/projects");
  };

  const canMatch = messages.some((m) => m.role === "user") && !streaming;

  return (
    <div className="flex h-[100dvh] flex-col bg-background hero-field">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/client"
            aria-label="Back to dashboard"
            className="grid size-9 place-items-center rounded-full border border-border/70 bg-white/80 text-navy-mid transition hover:bg-blue-mist"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="relative grid size-9 place-items-center rounded-xl bg-navy text-white">
              <Bot className="size-5" aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-accent-teal" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-navy">Intake agent</p>
              <p className="text-xs text-muted-foreground">Scoping &amp; pricing · online</p>
            </div>
          </div>
        </div>
        <Image
          src="/somahorse-logo.png"
          alt="Somahorse.ai"
          width={30}
          height={30}
          className="size-8 rounded-full object-contain"
          priority
        />
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {!aiReady ? <AiNotReady /> : null}

          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {streaming && messages[messages.length - 1]?.content === "" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-navy text-white">
                <Bot className="size-4" aria-hidden />
              </span>
              <TypingDots />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-3 text-sm text-accent-amber">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-3xl">
          {canMatch ? (
            <div className="mb-2.5 flex justify-center">
              <button
                type="button"
                onClick={openMatching}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-vivid/30 bg-blue-light/50 px-4 py-1.5 text-xs font-semibold text-navy-mid transition hover:bg-blue-light"
              >
                <UsersRound className="size-3.5" aria-hidden /> Match my team
              </button>
            </div>
          ) : null}
          <div className="flex items-end gap-2 rounded-3xl border border-border-strong bg-white/90 p-2 shadow-card focus-within:border-blue-vivid">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              disabled={!aiReady}
              placeholder={aiReady ? "Describe your project, or reply to the agent…" : "AI is not configured yet"}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-navy placeholder-muted-foreground/60 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || streaming || !aiReady}
              aria-label="Send"
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-mid text-white shadow-glow transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              {streaming ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CornerDownLeft className="size-4" aria-hidden />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            The Intake agent scopes and prices. Humans approve before any build begins.
          </p>
        </div>
      </div>

      {/* Matching panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: EASE }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-elevated"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-light/70 text-navy-mid">
                    <UsersRound className="size-4" aria-hidden />
                  </span>
                  <h2 className="font-display text-base font-bold text-navy">Your matched team</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full border border-border text-navy-mid"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {matchLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <Loader2 className="size-7 animate-spin text-navy-mid" aria-hidden />
                    <p className="text-sm text-muted-foreground">
                      The Matching agent is scoring certified developers…
                    </p>
                  </div>
                ) : matchError ? (
                  <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-4 text-sm text-accent-amber">
                    {matchError}
                  </div>
                ) : matchResult ? (
                  <div className="space-y-4">
                    <p className="flex items-start gap-2 rounded-2xl bg-blue-light/40 p-3 text-sm text-navy-mid">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-vivid" aria-hidden />
                      {matchResult.rationale}
                    </p>
                    {matchResult.team.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                        No strong match yet. You can still create the project — our team will staff it
                        as certified developers become available.
                      </p>
                    ) : (
                      matchResult.team.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-2xl border border-border bg-white p-4 shadow-soft"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-display text-sm font-bold text-navy">{member.name}</p>
                            <span className="rounded-full bg-accent-teal/12 px-2.5 py-0.5 text-xs font-bold text-accent-teal">
                              {member.matchScore}% match
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-navy-mid">{member.role}</p>
                          <p className="mt-1.5 text-sm text-muted-foreground">{member.reason}</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-border/60 px-5 py-4">
                {createError ? (
                  <p className="mb-2 text-xs font-medium text-accent-amber">{createError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={matchLoading || creating}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-mid px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-4" aria-hidden />
                  )}
                  {creating ? "Creating…" : "Create project & notify team"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ role, content }: { role: ChatMessage["role"]; content: string }) {
  const isUser = role === "user";
  if (!content) return null;
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${
          isUser ? "bg-blue-light text-navy-mid" : "bg-navy text-white"
        }`}
      >
        {isUser ? "You" : <Bot className="size-4" aria-hidden />}
      </span>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-navy-mid text-white"
            : "rounded-tl-sm border border-border/70 bg-white/90 text-navy shadow-soft"
        }`}
      >
        <RichText text={content} muted={!isUser} />
      </div>
    </div>
  );
}

/** Minimal renderer: paragraphs, bullets, and **bold** spans. */
function RichText({ text, muted }: { text: string; muted: boolean }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;
        const isBullet = /^[-*•]\s+/.test(trimmed);
        const body = isBullet ? trimmed.replace(/^[-*•]\s+/, "") : trimmed;
        return (
          <p key={i} className={isBullet ? "flex gap-2" : ""}>
            {isBullet ? (
              <span className={muted ? "text-blue-vivid" : "text-white/80"}>•</span>
            ) : null}
            <span>{renderInline(body)}</span>
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-navy-mid/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function AiNotReady() {
  return (
    <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-4 text-sm text-accent-amber">
      The AI intake agent isn&apos;t configured yet. Add a <code className="font-mono">GEMINI_API_KEY</code> to enable the conversation.
    </div>
  );
}
