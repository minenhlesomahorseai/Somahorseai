"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ReceiptText } from "lucide-react";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

const QUOTE_LINES = [
  { label: "Build fee", value: "Scoped to your brief" },
  { label: "Start payment", value: "About one-third" },
  { label: "Delivery balance", value: "Staged by milestone" },
  { label: "After launch", value: "Monthly, when included" },
] as const;

export function PricingHero({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="relative isolate overflow-hidden px-3 pb-10 pt-3 sm:px-4 sm:pb-16">
      <div className="hero-field absolute inset-x-3 bottom-3 top-2 -z-10 overflow-hidden rounded-[28px] border border-border shadow-calm sm:inset-x-4 md:rounded-[40px]">
        <div className="dotted-grid absolute inset-0 opacity-35" />
        <div className="absolute -left-20 top-16 size-72 rounded-full bg-blue-vivid/10 blur-[110px]" />
        <div className="absolute -right-24 bottom-0 size-80 rounded-full bg-talent-bright/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[44rem] max-w-7xl items-center gap-10 px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.78fr)] lg:gap-16 lg:px-10">
        <div className="min-w-0">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.08 }}
            className="max-w-4xl text-balance font-display text-[clamp(3rem,8vw,6.2rem)] font-bold leading-[0.94] tracking-[-0.06em] text-navy"
          >
            A clear price for a <span className="text-gradient">clear outcome.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.16 }}
            className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            No generic software bundle. Describe the operational problem, review an AI-assisted scope, and receive a project quote in rand with the payment schedule shown before delivery begins.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link href={ctaHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy-mid px-6 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-navy">
              Scope my project <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="#budget-guide" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-strong bg-white/75 px-6 text-sm font-bold text-navy transition hover:border-navy-mid/30 hover:bg-white">
              See budget guide
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2"
          >
            {["ZAR project quotes", "Visible payment status", "Secure Paddle checkout"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                <CheckCircle2 className="size-4 text-accent-teal" aria-hidden /> {item}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: EASE, delay: 0.18 }}
          className="relative min-w-0"
        >
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-blue-vivid/10 to-talent-bright/10 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 p-5 shadow-elevated backdrop-blur-2xl sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-vivid">Your project quote</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-navy">Easy to understand</h2>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-mist text-navy-mid ring-1 ring-navy-mid/10">
                <ReceiptText className="size-5" aria-hidden />
              </span>
            </div>

            <dl className="divide-y divide-border/70">
              {QUOTE_LINES.map((line) => (
                <div key={line.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
                  <dt className="text-sm text-muted-foreground">{line.label}</dt>
                  <dd className="text-right text-sm font-bold text-navy">{line.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-2 rounded-2xl border border-accent-teal/15 bg-accent-teal/8 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-teal">Before you pay</p>
              <p className="mt-2 text-sm leading-6 text-navy/75">Review the scope, delivery milestones, build fee, deposit, and any monthly monitoring amount in one place.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
