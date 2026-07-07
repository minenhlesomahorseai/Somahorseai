"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardX,
  Clock,
  Eye,
  ListChecks,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import type { AssessmentAnswers, AssessmentQuestion } from "@/lib/auth/types";

import {
  disqualifyAssessment,
  startAssessment,
  submitAssessment,
} from "./actions";

const MAX_VIOLATIONS = 3;
const TYPE_LABEL: Record<AssessmentQuestion["type"], string> = {
  multiple_choice: "Multiple choice",
  scenario: "Scenario",
  problem: "Problem to solve",
};

type Phase = "rules" | "test" | "submitting" | "done" | "disqualified";

export function AssessmentRunner({
  token,
  questions,
  timeLimitSeconds,
  resuming,
}: {
  token: string;
  questions: AssessmentQuestion[];
  timeLimitSeconds: number;
  resuming: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("rules");
  const [webcamOn, setWebcamOn] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const [violations, setViolations] = useState(0);
  const [pasteFlags, setPasteFlags] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastViolation = useRef(0);
  const answersRef = useRef(answers);
  const pasteRef = useRef(0);
  const violationsRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
    pasteRef.current = pasteFlags;
    violationsRef.current = violations;
  }, [answers, pasteFlags, violations]);

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length,
    [answers, questions]
  );

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitting");
    stopWebcam();
    try {
      await submitAssessment({
        token,
        answers: answersRef.current,
        pasteFlags: pasteRef.current,
        tabViolations: violationsRef.current,
      });
    } catch (e) {
      console.error(e);
    }
    setPhase("done");
    router.refresh();
  }, [router, stopWebcam, token]);

  const doDisqualify = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopWebcam();
    try {
      await disqualifyAssessment({
        token,
        reason: "Left the assessment window more than the allowed number of times.",
        tabViolations: MAX_VIOLATIONS,
      });
    } catch (e) {
      console.error(e);
    }
    setPhase("disqualified");
    router.refresh();
  }, [router, stopWebcam, token]);

  // Countdown timer (runs only during the test).
  useEffect(() => {
    if (phase !== "test") return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          void doSubmit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, doSubmit]);

  // Tab / window leave detection (3-strike rule).
  useEffect(() => {
    if (phase !== "test") return;
    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      const now = Date.now();
      if (now - lastViolation.current < 800) return;
      lastViolation.current = now;
      setViolations((v) => {
        const next = v + 1;
        if (next >= MAX_VIOLATIONS) {
          void doDisqualify();
        } else {
          const left = MAX_VIOLATIONS - next;
          flashToast(
            `Warning: you left the assessment window. ${left} strike${left === 1 ? "" : "s"} left before disqualification.`
          );
        }
        return next;
      });
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", onHidden);
    };
  }, [phase, doDisqualify, flashToast]);

  useEffect(() => () => stopWebcam(), [stopWebcam]);

  const beginTest = async () => {
    setStarting(true);
    try {
      await startAssessment(token);
    } catch (e) {
      console.error(e);
    }
    setStarting(false);
    setPhase("test");
  };

  const requestWebcam = async () => {
    if (webcamOn) {
      stopWebcam();
      setWebcamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setWebcamOn(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch {
      flashToast("Could not access the webcam — you can still continue without it.");
    }
  };

  const setAnswer = (qid: string, value: string) =>
    setAnswers((a) => ({ ...a, [qid]: value }));

  if (phase === "rules") {
    return (
      <RulesScreen
        count={questions.length}
        minutes={Math.round(timeLimitSeconds / 60)}
        webcamOn={webcamOn}
        onToggleWebcam={requestWebcam}
        onStart={beginTest}
        starting={starting}
        resuming={resuming}
      />
    );
  }

  if (phase === "submitting") {
    return <CenteredNote icon={<Loader2 className="size-7 animate-spin" />} title="Submitting your assessment…" body="Hang tight — we're saving your answers and grading them." />;
  }

  if (phase === "done") {
    return (
      <CenteredNote
        icon={<CheckCircle2 className="size-7 text-accent-teal" />}
        title="Thank you — your assessment is in"
        body="We've received your answers and our team is reviewing them. You'll hear from us by email. You can close this tab."
      />
    );
  }

  if (phase === "disqualified") {
    return (
      <CenteredNote
        icon={<ShieldAlert className="size-7 text-accent-amber" />}
        title="Assessment ended"
        body="You left the assessment window too many times, so the session was closed per the rules you accepted. Our team has been notified."
      />
    );
  }

  const q = questions[current];
  const strikesLeft = MAX_VIOLATIONS - violations;

  return (
    <div className="relative">
      {/* Top bar: timer + strikes */}
      <div className="sticky top-0 z-10 -mx-5 mb-6 flex items-center justify-between gap-3 border-b border-border-strong bg-blue-mist/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy">
          <ListChecks className="size-4 text-navy-mid" />
          {answeredCount}/{questions.length} answered
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              strikesLeft <= 1
                ? "bg-accent-amber/15 text-accent-amber"
                : "bg-white text-navy-mid"
            }`}
          >
            <ShieldAlert className="size-3.5" />
            {strikesLeft} strike{strikesLeft === 1 ? "" : "s"} left
          </span>
          <Timer remaining={remaining} />
        </div>
      </div>

      {/* Question navigator */}
      <div className="mb-6 flex flex-wrap gap-2">
        {questions.map((item, i) => {
          const answered = (answers[item.id] ?? "").trim().length > 0;
          const active = i === current;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`size-9 rounded-lg text-sm font-bold transition ${
                active
                  ? "bg-navy-mid text-white"
                  : answered
                    ? "bg-accent-teal/15 text-accent-teal"
                    : "bg-white text-navy-mid hover:bg-blue-light"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {webcamOn && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="mb-5 ml-auto h-24 w-32 rounded-lg border border-border-strong object-cover shadow-sm"
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border-strong bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-mid/70">
            <span>Question {current + 1}</span>
            <span aria-hidden>·</span>
            <span>{TYPE_LABEL[q.type]}</span>
            {q.focus && (
              <span className="rounded-full bg-blue-light px-2 py-0.5 text-[10px] text-navy-mid">
                {q.focus}
              </span>
            )}
          </div>
          <p className="mt-3 whitespace-pre-line text-base font-medium leading-relaxed text-navy">
            {q.prompt}
          </p>

          <div className="mt-5">
            {q.options && q.options.length > 0 ? (
              <fieldset className="space-y-2.5">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
                        selected
                          ? "border-navy-mid bg-blue-mist"
                          : "border-border-strong bg-white hover:border-navy-mid/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={selected}
                        onChange={() => setAnswer(q.id, opt.id)}
                        className="mt-0.5 size-4 accent-navy-mid"
                      />
                      <span className="text-navy">{opt.text}</span>
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <ProblemAnswer
                value={answers[q.id] ?? ""}
                onChange={(v) => setAnswer(q.id, v)}
                onPasteBlocked={() => {
                  setPasteFlags((p) => p + 1);
                  flashToast("Pasting is disabled here and has been flagged for review.");
                }}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="inline-flex min-h-11 items-center rounded-full border border-border-strong bg-white px-5 text-sm font-bold text-navy-mid transition enabled:hover:bg-blue-light disabled:opacity-40"
        >
          Back
        </button>
        {current < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="inline-flex min-h-11 items-center rounded-full bg-navy-mid px-6 text-sm font-bold text-white transition hover:bg-navy"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void doSubmit()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-teal px-6 text-sm font-bold text-white transition hover:brightness-95"
          >
            <CheckCircle2 className="size-4" />
            Submit assessment
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {answeredCount < questions.length
          ? `${questions.length - answeredCount} question${questions.length - answeredCount === 1 ? "" : "s"} still unanswered — you can submit anytime.`
          : "All questions answered. You can review with the navigator above before submitting."}
      </p>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-5 z-20 mx-auto max-w-md rounded-xl border border-accent-amber/30 bg-white px-4 py-3 text-sm font-medium text-navy shadow-lg"
          >
            <span className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-amber" />
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProblemAnswer({
  value,
  onChange,
  onPasteBlocked,
}: {
  value: string;
  onChange: (v: string) => void;
  onPasteBlocked: () => void;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          onPasteBlocked();
        }}
        onDrop={(e) => e.preventDefault()}
        rows={8}
        placeholder="Explain your approach, the trade-offs you'd weigh, and how you'd implement it…"
        className="w-full resize-y rounded-xl border border-border-strong bg-white p-4 text-sm leading-relaxed text-navy outline-none transition focus:border-blue-vivid focus:ring-2 focus:ring-blue-vivid/15"
      />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClipboardX className="size-3.5" />
        Pasting is disabled in answer boxes to keep the assessment fair.
      </p>
    </div>
  );
}

function Timer({ remaining }: { remaining: number }) {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const low = remaining <= 120;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
        low ? "bg-accent-amber/15 text-accent-amber" : "bg-navy-mid text-white"
      }`}
    >
      <Clock className="size-3.5" />
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

function RulesScreen({
  count,
  minutes,
  webcamOn,
  onToggleWebcam,
  onStart,
  starting,
  resuming,
}: {
  count: number;
  minutes: number;
  webcamOn: boolean;
  onToggleWebcam: () => void;
  onStart: () => void;
  starting: boolean;
  resuming: boolean;
}) {
  const rules = [
    {
      icon: ClipboardX,
      title: "No copy / paste in answers",
      body: "Pasting into answer boxes is disabled and any attempt is flagged for our reviewers. Write your answers in your own words.",
    },
    {
      icon: ShieldAlert,
      title: "Stay in this window — 3 strikes",
      body: "Leaving the tab or window counts as a strike. After 3 strikes you're automatically disqualified. You'll be warned each time.",
    },
    {
      icon: Eye,
      title: "Webcam (optional)",
      body: "You can optionally turn on your webcam. It stays on your device — we don't record it — and just helps keep the assessment fair for everyone.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto mt-6 max-w-2xl"
    >
      <div className="rounded-2xl border border-border-strong bg-white p-7 shadow-sm sm:p-9">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-mid">
          Somahorse.ai assessment
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          {resuming ? "Resume your assessment" : "Before you start"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This is a unique, AI-curated assessment based on your application —
          {" "}
          <strong className="text-navy">{count} questions</strong> in{" "}
          <strong className="text-navy">{minutes} minutes</strong>. The timer starts
          when you begin and submits automatically when it runs out. Please read the
          rules — we apply them equally to every candidate.
        </p>

        <div className="mt-6 space-y-3">
          {rules.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="flex items-start gap-3 rounded-xl border border-border-strong bg-blue-mist/40 p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-mid text-white">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-navy">{r.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {r.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleWebcam}
          className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition ${
            webcamOn
              ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
              : "border-border-strong bg-white text-navy-mid hover:bg-blue-light"
          }`}
        >
          <Eye className="size-4" />
          {webcamOn ? "Webcam on — thanks!" : "Turn on webcam (optional)"}
        </button>

        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-mid px-6 text-sm font-bold text-white transition hover:bg-navy disabled:opacity-60"
        >
          {starting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          I understand the rules — start the test
        </button>
      </div>
    </motion.div>
  );
}

function CenteredNote({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border-strong bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-mist">
        {icon}
      </div>
      <h1 className="mt-4 font-display text-xl font-bold text-navy">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
