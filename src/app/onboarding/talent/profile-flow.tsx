"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CloudCheck, Loader2, Plus, X } from "lucide-react";

import type { TalentOnboarding } from "@/lib/auth/types";
import {
  TALENT_EXPERIENCE,
  TALENT_ROLES,
  TALENT_SKILLS,
} from "@/lib/onboarding/options";

import { saveTalentProgress, submitTalentProfile } from "./actions";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  { label: "Role", hint: "Your primary discipline" },
  { label: "Experience", hint: "How long you've been building" },
  { label: "Skills", hint: "What you're strongest in" },
  { label: "About", hint: "Tell your story" },
  { label: "Links", hint: "Portfolio & code" },
];

type SaveState = "idle" | "saving" | "saved";

interface ProfileForm {
  primary_role: string | null;
  years_experience: number | null;
  skills: string[];
  headline: string;
  bio: string;
  agri_experience: string;
  country: string;
  portfolio_url: string;
  github_url: string;
}

export function TalentProfileFlow({
  initial,
  firstName,
}: {
  initial: TalentOnboarding;
  firstName: string | null;
}) {
  const [step, setStep] = useState(
    Math.min(initial.current_step ?? 0, STEPS.length - 1)
  );
  const [form, setForm] = useState<ProfileForm>({
    primary_role: initial.primary_role,
    years_experience: initial.years_experience,
    skills: initial.skills ?? [],
    headline: initial.headline ?? "",
    bio: initial.bio ?? "",
    agri_experience: initial.agri_experience ?? "",
    country: initial.country ?? "",
    portfolio_url: initial.portfolio_url ?? "",
    github_url: initial.github_url ?? "",
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
    primary_role: form.primary_role,
    years_experience: form.years_experience,
    skills: form.skills,
    headline: form.headline || null,
    bio: form.bio || null,
    agri_experience: form.agri_experience || null,
    country: form.country || null,
    portfolio_url: form.portfolio_url || null,
    github_url: form.github_url || null,
  });

  const goTo = (nextStep: number, persist: boolean) => {
    setError("");
    setStep(nextStep);
    if (persist) {
      setSaveState("saving");
      startTransition(async () => {
        try {
          await saveTalentProgress(payload(nextStep));
          flashSaved();
        } catch (e) {
          setSaveState("idle");
          setError(e instanceof Error ? e.message : "Could not save progress.");
        }
      });
    }
  };

  const submit = () => {
    setError("");
    setSaveState("saving");
    startTransition(async () => {
      try {
        await submitTalentProfile(payload(STEPS.length - 1));
        setSaveState("idle");
        setSubmitted(true);
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        setSaveState("idle");
        setError(e instanceof Error ? e.message : "Could not submit application.");
      }
    });
  };

  const toggleSkill = (skill: string) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return Boolean(form.primary_role);
      case 1:
        return form.years_experience !== null;
      case 2:
        return form.skills.length > 0;
      case 3:
        return form.bio.trim().length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  })();

  const isLast = step === STEPS.length - 1;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="dotted-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="pointer-events-none absolute -top-32 right-[-10%] size-[520px] rounded-full bg-blue-sky/10 blur-[150px]" />

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
            <p className="cue mb-1 text-navy-mid">Talent onboarding</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-navy">
              Set up your profile
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
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-mid/70">
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
                <StepBody
                  step={step}
                  firstName={firstName}
                  form={form}
                  setForm={setForm}
                  toggleSkill={toggleSkill}
                />
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
                onClick={() => (isLast ? submit() : goTo(step + 1, true))}
                disabled={!canAdvance || pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving
                  </>
                ) : isLast ? (
                  "Submit for review"
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
  toggleSkill,
}: {
  step: number;
  firstName: string | null;
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  toggleSkill: (skill: string) => void;
}) {
  if (step === 0) {
    return (
      <>
        <Heading
          title={`Let's build your profile${firstName ? `, ${firstName}` : ""}`}
          subtitle="What's your primary discipline? You'll add specific skills next."
        />
        <FlatOptionGrid
          options={TALENT_ROLES}
          value={form.primary_role}
          onSelect={(value) => setForm((f) => ({ ...f, primary_role: value }))}
        />
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <Heading
          title="How much experience do you have?"
          subtitle="Be honest — our Certification Agent verifies this through real builds."
        />
        <FlatOptionGrid
          options={TALENT_EXPERIENCE}
          value={form.years_experience ? String(form.years_experience) : null}
          onSelect={(value) =>
            setForm((f) => ({ ...f, years_experience: Number(value) }))
          }
        />
      </>
    );
  }

  if (step === 2) {
    return <SkillsStep form={form} setForm={setForm} toggleSkill={toggleSkill} />;
  }

  if (step === 3) {
    return (
      <>
        <Heading
          title="Tell us about your work"
          subtitle="Agricultural context is a real advantage at Somahorse.ai."
        />
        <div className="space-y-5">
          <Field
            id="headline"
            label="Headline"
            value={form.headline}
            onChange={(v) => setForm((f) => ({ ...f, headline: v }))}
            placeholder="e.g. Full-stack engineer focused on data platforms"
          />
          <TextAreaField
            id="bio"
            label="Short bio"
            value={form.bio}
            onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
            placeholder="What have you built? What are you best at?"
            rows={4}
          />
          <TextAreaField
            id="agri"
            label="Agricultural / supply-chain experience (optional)"
            value={form.agri_experience}
            onChange={(v) => setForm((f) => ({ ...f, agri_experience: v }))}
            placeholder="Any farming, logistics, or supply-chain context you understand."
            rows={3}
          />
          <Field
            id="country"
            label="Country"
            value={form.country}
            onChange={(v) => setForm((f) => ({ ...f, country: v }))}
            placeholder="e.g. South Africa"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Heading
        title="Show us your work"
        subtitle="Optional links that help our team review your application."
      />
      <div className="space-y-5">
        <Field
          id="portfolio"
          label="Portfolio / website"
          value={form.portfolio_url}
          onChange={(v) => setForm((f) => ({ ...f, portfolio_url: v }))}
          placeholder="https://"
        />
        <Field
          id="github"
          label="GitHub"
          value={form.github_url}
          onChange={(v) => setForm((f) => ({ ...f, github_url: v }))}
          placeholder="https://github.com/username"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-blue-vivid/15 bg-blue-light/40 p-4 text-sm text-navy-mid">
        When you submit, your application goes to our team for review. You&apos;ll be
        guided through a technical assessment and an interview before joining the
        network.
      </div>
    </>
  );
}

function SkillsStep({
  form,
  setForm,
  toggleSkill,
}: {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  toggleSkill: (skill: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const customSkills = form.skills.filter(
    (s) => !TALENT_SKILLS.includes(s)
  );

  const addSkill = (raw: string) => {
    const value = raw.trim().replace(/,+$/, "").trim();
    if (!value) return;
    const exists = form.skills.some(
      (s) => s.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      setForm((f) => ({ ...f, skills: [...f.skills, value] }));
    }
    setDraft("");
  };

  const removeSkill = (skill: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === "Backspace" && draft === "" && customSkills.length > 0) {
      removeSkill(customSkills[customSkills.length - 1]);
    }
  };

  return (
    <>
      <Heading
        title="Select your skills"
        subtitle="Pick everything you're strong in. This drives how the Matching Agent scores you."
      />
      <div className="flex flex-wrap gap-2">
        {TALENT_SKILLS.map((skill) => {
          const selected = form.skills.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                selected
                  ? "border-navy-mid bg-navy-mid text-white"
                  : "border-border-strong bg-white text-navy-mid hover:border-navy-mid/40 hover:bg-blue-mist"
              }`}
            >
              {selected ? (
                <Check className="size-3.5 stroke-[3]" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {skill}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <label
          htmlFor="custom-skill"
          className="font-display text-xs font-bold uppercase tracking-wide text-navy-mid/80"
        >
          Add your own
        </label>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          Type a skill and press <span className="font-semibold text-navy-mid">Enter</span> (or
          comma) to add it.
        </p>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-strong bg-white px-3 py-2.5 transition focus-within:border-blue-vivid focus-within:ring-2 focus-within:ring-blue-vivid/15">
          {customSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-blue-light/70 px-2.5 py-1 text-xs font-semibold text-navy-mid"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="grid size-4 place-items-center rounded-full text-navy-mid/60 transition hover:bg-navy-mid/10 hover:text-navy-mid"
              >
                <X className="size-3 stroke-[3]" />
              </button>
            </span>
          ))}
          <input
            id="custom-skill"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => addSkill(draft)}
            placeholder={customSkills.length ? "Add another…" : "e.g. Solidity, Rust embedded, Agronomy"}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 text-sm text-navy placeholder-muted-foreground/50 focus:outline-none"
          />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-muted-foreground">
        {form.skills.length} selected
      </p>
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
                      ? "border-accent-teal bg-accent-teal text-white"
                      : active
                        ? "border-navy-mid bg-navy-mid text-white shadow-glow"
                        : "border-border-strong bg-white text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-4 stroke-[3]" /> : i + 1}
                </span>
                {i < STEPS.length - 1 ? (
                  <span
                    className={`mt-1 h-7 w-0.5 rounded-full ${
                      done ? "bg-accent-teal" : "bg-border"
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
        <p className="cue text-navy-mid">{STEPS[current].label}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {current + 1}/{STEPS.length}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.label}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= current ? "bg-navy-mid" : "bg-border"
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
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-mist px-3 py-1.5 text-xs font-semibold text-navy-mid"
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
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/12 px-3 py-1.5 text-xs font-semibold text-accent-teal"
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
            <span className="size-1.5 rounded-full bg-accent-teal animate-glow-pulse" />
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
          className="grid size-20 place-items-center rounded-full bg-accent-teal text-white shadow-glow"
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
          Application submitted
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Nicely done. We&apos;re taking you to your application status…
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
  options: typeof TALENT_ROLES;
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
                ? "border-navy-mid bg-blue-light/50 ring-1 ring-navy-mid/20"
                : "border-border bg-white hover:border-border-strong hover:bg-blue-mist"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                selected
                  ? "bg-navy-mid text-white"
                  : "bg-blue-light/70 text-navy-mid group-hover:bg-blue-light"
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
                  ? "border-accent-teal bg-accent-teal text-white"
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
        className="w-full min-h-11 rounded-xl border border-border-strong bg-white px-4 text-sm text-navy placeholder-muted-foreground/50 transition focus:border-blue-vivid focus:outline-none focus:ring-2 focus:ring-blue-vivid/15"
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
        className="w-full rounded-xl border border-border-strong bg-white px-4 py-3 text-sm text-navy placeholder-muted-foreground/50 transition focus:border-blue-vivid focus:outline-none focus:ring-2 focus:ring-blue-vivid/15"
      />
    </div>
  );
}
