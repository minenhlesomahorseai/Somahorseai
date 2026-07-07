"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import type { SelectOption } from "@/lib/onboarding/options";

export function OnboardingShell({
  children,
  eyebrow,
  accent = "teal",
}: {
  children: React.ReactNode;
  eyebrow?: string;
  accent?: "teal" | "blue";
}) {
  const dot = accent === "teal" ? "bg-accent-teal" : "bg-blue-vivid";
  return (
    <div className="relative min-h-screen overflow-hidden bg-background hero-field dotted-grid">
      <div className="pointer-events-none absolute -top-40 left-1/4 size-[600px] rounded-full bg-blue-sky/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-[600px] rounded-full bg-navy-mid/10 blur-[140px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
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
        {eyebrow ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className={`size-1.5 rounded-full ${dot} animate-glow-pulse`} />
            {eyebrow}
          </span>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-20 pt-4">
        {children}
      </main>
    </div>
  );
}

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-2">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                    done
                      ? "border-accent-teal bg-accent-teal text-white"
                      : active
                        ? "border-navy-mid bg-navy-mid text-white shadow-glow"
                        : "border-border-strong bg-white/70 text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-4 stroke-[3]" /> : index + 1}
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                      done ? "bg-accent-teal" : "bg-border"
                    }`}
                  />
                ) : null}
              </div>
              <span
                className={`hidden text-center text-[11px] font-semibold sm:block ${
                  active ? "text-navy" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7 text-center">
      <h1 className="font-ui text-2xl font-bold tracking-tight text-navy sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function OptionGrid({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: SelectOption[];
  value: string | null;
  onSelect: (value: string) => void;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`grid gap-3 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-navy-mid bg-white shadow-card ring-2 ring-blue-vivid/15"
                : "border-border bg-white/70 hover:border-border-strong hover:bg-white hover:shadow-soft"
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
              <span className="block text-sm font-bold text-navy font-ui">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
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

export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  loading = false,
  showBack = true,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="mt-9 flex items-center justify-between gap-3">
      {showBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-navy disabled:opacity-50"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50 font-ui"
      >
        {loading ? "Saving…" : nextLabel}
      </button>
    </div>
  );
}

export function OnboardingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/80 bg-white/80 p-6 shadow-elevated backdrop-blur-xl sm:p-9">
      {children}
    </div>
  );
}
