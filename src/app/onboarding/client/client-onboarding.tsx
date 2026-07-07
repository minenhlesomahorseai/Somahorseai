"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CloudCheck, Loader2, Sparkles } from "lucide-react";

import type { ClientOnboarding as ClientOnboardingData } from "@/lib/auth/types";
import {
  CLIENT_BUDGETS,
  CLIENT_PROJECT_TYPES,
  CLIENT_SECTORS,
  CLIENT_TIMELINES,
} from "@/lib/onboarding/options";

import { saveClientProgress, submitClientOnboarding } from "./actions";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  { label: "Sector", hint: "Where you operate" },
  { label: "Build", hint: "What you need built" },
  { label: "Timeline", hint: "When you need it" },
  { label: "Details", hint: "Company & problem" },
  { label: "Budget", hint: "A rough range" },
];

type SaveState = "idle" | "saving" | "saved";

interface FormState {
  sector: string | null;
  project_type: string | null;
  timeline: string | null;
  company_name: string;
  problem: string;
  budget_range: string | null;
}

export function ClientOnboarding({
  initial,
  firstName,
}: {
  initial: ClientOnboardingData;
  firstName: string | null;
}) {
  const [step, setStep] = useState(
    Math.min(initial.current_step ?? 0, STEPS.length - 1)
  );
  const [form, setForm] = useState<FormState>({
    sector: initial.sector,
    project_type: initial.project_type,
    timeline: initial.timeline,
    company_name: initial.company_name ?? "",
    problem: initial.problem ?? "",
    budget_range: initial.budget_range,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitted, setSubmitted] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const flashSaved = () => {
    setSaveState("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveState("idle"), 2200);
  };

  const payload = (nextStep: number) => ({
    current_step: nextStep,
    sector: form.sector,
    project_type: form.project_type,
    timeline: form.timeline,
    company_name: form.company_name || null,
    problem: form.problem || null,
    budget_range: form.budget_range,
  });

  const goTo = (nextStep: number, persist: boolean) => {
    setError("");
    setStep(nextStep);
    if (persist) {
      setSaveState("saving");
      startTransition(async () => {
        try {
          await saveClientProgress(payload(nextStep));
          flashSaved();
        } catch (e) {
          setSaveState("idle");
          setError(e instanceof Error ? e.message : "Could not save progress.");
        }
      });
    }
  };

  const finish = () => {
    setError("");
    setSaveState("saving");
    startTransition(async () => {
      try {
        await submitClientOnboarding(payload(STEPS.length - 1));
        setSaveState("idle");
        setSubmitted(true);
      } catch (e) {
        setSaveState("idle");
        setError(e instanceof Error ? e.message : "Could not finish onboarding.");
      }
    });
  };

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return Boolean(form.sector);
      case 1:
        return Boolean(form.project_type);
      case 2:
        return Boolean(form.timeline);
      case 3:
        return true;
      case 4:
        return Boolean(form.budget_range);
      default:
        return false;
    }
  })();

  const isLast = step === STEPS.length - 1;

  return (
    <div className="relative flex min-h-screen flex-col bg-background client-field">
      <div className="client-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-32 right-[-10%] size-[520px] rounded-full bg-client-bright/10 blur-[150px]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={34}
            height={34}
            className="size-8 rounded-full object-contain"
            priority
          />
          <span className="font-display text-base font-bold text-navy">
            Somahorse<span className="text-blue-vivid">.ai</span>
          </span>
        </Link>
        <SaveStatus state={saveState} />
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-[260px_1fr] lg:gap-14">
        {/* Left rail — vertical stepper (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="cue mb-1 text-client">Client onboarding</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-navy">
              Scope your project
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Five quick steps. Progress saves automatically.
            </p>
            <VerticalStepper current={step} onJump={(i) => goTo(i, false)} />
          </div>
        </aside>

        {/* Right content */}
        <main className="min-w-0">
          {/* Mobile progress */}
          <MobileProgress current={step} />

          <div className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-client/80">
              Step {step + 1} of {STEPS.length}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: EASE }}
              >
                <StepBody step={step} firstName={firstName} form={form} setForm={setForm} />
              </motion.div>
            </AnimatePresence>

            {error ? (
              <div className="mt-6 rounded-xl border border-accent-amber/25 bg-accent-amber/10 px-4 py-3 text-sm font-medium text-accent-amber">
                {error}
              </div>
            ) : null}

            {/* Nav */}
            <div className="mt-9 flex items-center justify-between gap-3 border-t border-border pt-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(step - 1, false)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-navy disabled:opacity-50"
                >
                  <ArrowLeft className="size-4" aria-hidden /> Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => (isLast ? finish() : goTo(step + 1, true))}
                disabled={!canAdvance || pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-client px-7 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving
                  </>
                ) : isLast ? (
                  "Finish & go to dashboard"
                ) : (
                  <>
                    Continue <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>{submitted ? <SuccessOverlay /> : null}</AnimatePresence>
    </div>
  );
}

function StepBody({
  step,
  firstName,
  form,
  setForm,
}: {
  step: number;
  firstName: string | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  if (step === 0) {
    return (
      <>
        <Heading
          title={`Welcome${firstName ? `, ${firstName}` : ""}`}
          subtitle="Which sector are you building for? This helps our Intake Agent scope the right solution."
        />
        <FlatOptionGrid
          options={CLIENT_SECTORS}
          value={form.sector}
          onSelect={(value) => setForm((f) => ({ ...f, sector: value }))}
        />
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <Heading
          title="What do you want to build?"
          subtitle="Pick the closest fit — our AI refines the exact scope with you later."
        />
        <FlatOptionGrid
          options={CLIENT_PROJECT_TYPES}
          value={form.project_type}
          onSelect={(value) => setForm((f) => ({ ...f, project_type: value }))}
        />
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <Heading
          title="When do you need it?"
          subtitle="A rough timeline is fine. It guides how we assemble your team."
        />
        <FlatOptionGrid
          options={CLIENT_TIMELINES}
          value={form.timeline}
          onSelect={(value) => setForm((f) => ({ ...f, timeline: value }))}
        />
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <Heading
          title="Tell us a little more"
          subtitle="Optional — but it gives our Intake Agent a head start."
        />
        <div className="space-y-5">
          <Field
            id="company_name"
            label="Company name"
            value={form.company_name}
            onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
            placeholder="e.g. Kalahari Fresh Produce"
          />
          <TextAreaField
            id="problem"
            label="Describe the problem"
            value={form.problem}
            onChange={(v) => setForm((f) => ({ ...f, problem: v }))}
            placeholder="In plain language — the same way you'd explain it to a colleague."
            rows={4}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Heading
        title="What's your budget?"
        subtitle="A range is all we need. Our AI prices the exact scope and guarantees a fixed quote."
      />
      <FlatOptionGrid
        options={CLIENT_BUDGETS}
        value={form.budget_range}
        onSelect={(value) => setForm((f) => ({ ...f, budget_range: value }))}
      />
      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-client/15 bg-client-tint/60 p-4 text-sm text-client">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Once you finish, our Intake Agent reviews your answers and prepares a
          scoped, costed plan in your dashboard.
        </p>
      </div>
    </>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7 mt-3">
      <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

function VerticalStepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="mt-7 space-y-1">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const reachable = i <= current;
        return (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => reachable && onJump(i)}
              disabled={!reachable}
              className={`group flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                active ? "bg-white shadow-soft" : "hover:bg-white/60"
              } ${reachable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="relative flex flex-col items-center">
                <span
                  className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                    done
                      ? "border-client-bright bg-client-bright text-white"
                      : active
                        ? "border-client bg-client text-white shadow-glow"
                        : "border-border-strong bg-white text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-4 stroke-[3]" /> : i + 1}
                </span>
                {i < STEPS.length - 1 ? (
                  <span
                    className={`mt-1 h-7 w-0.5 rounded-full ${
                      done ? "bg-client-bright" : "bg-border"
                    }`}
                  />
                ) : null}
              </span>
              <span className="pt-1">
                <span
                  className={`block text-sm font-bold ${
                    active || done ? "text-navy" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {s.hint}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function MobileProgress({ current }: { current: number }) {
  const pct = ((current + 1) / STEPS.length) * 100;
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        <p className="cue text-client">{STEPS[current].label}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {current + 1}/{STEPS.length}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.label}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= current ? "bg-client" : "bg-border"
            }`}
          />
        ))}
      </div>
      <div className="sr-only">{pct}% complete</div>
    </div>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  return (
    <div className="flex h-7 items-center">
      <AnimatePresence mode="wait">
        {state === "saving" ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-client-tint px-3 py-1.5 text-xs font-semibold text-client"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Saving
          </motion.span>
        ) : state === "saved" ? (
          <motion.span
            key="saved"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-client-bright/12 px-3 py-1.5 text-xs font-semibold text-client-bright"
          >
            <CloudCheck className="size-3.5" aria-hidden />
            Saved
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-client-bright animate-glow-pulse" />
            Autosave on
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-white/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="flex flex-col items-center text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 16 }}
          className="grid size-20 place-items-center rounded-full bg-client text-white shadow-glow"
        >
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 260, damping: 14 }}
          >
            <Check className="size-10 stroke-[3]" aria-hidden />
          </motion.span>
        </motion.span>
        <h2 className="mt-6 font-display text-2xl font-bold text-navy">
          Onboarding complete
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Nicely done. We&apos;re taking you to your dashboard…
        </p>
      </motion.div>
    </motion.div>
  );
}

function FlatOptionGrid({
  options,
  value,
  onSelect,
}: {
  options: ReadonlyArray<{
    value: string;
    label: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  value: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-client bg-client-tint ring-1 ring-client/20"
                : "border-border bg-white hover:border-border-strong hover:bg-client-tint/50"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                selected
                  ? "bg-client text-white"
                  : "bg-client-tint text-client group-hover:bg-client/15"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-navy">
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                selected
                  ? "border-client-bright bg-client-bright text-white"
                  : "border-border-strong bg-white"
              }`}
            >
              {selected ? <Check className="size-3 stroke-[3]" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="font-display text-xs font-bold uppercase tracking-wide text-navy-mid/80"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-11 rounded-xl border border-border-strong bg-white px-4 text-sm text-navy placeholder-muted-foreground/50 transition focus:border-client-bright focus:outline-none focus:ring-2 focus:ring-client-bright/15"
      />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="font-display text-xs font-bold uppercase tracking-wide text-navy-mid/80"
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-border-strong bg-white px-4 py-3 text-sm text-navy placeholder-muted-foreground/50 transition focus:border-client-bright focus:outline-none focus:ring-2 focus:ring-client-bright/15"
      />
    </div>
  );
}
