"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    n: "01",
    title: "Describe the problem",
    body: "Tell us, in plain language, what's slowing your operation down — patchy connectivity, lost produce, failed audits, blind forecasting.",
  },
  {
    n: "02",
    title: "We scope & build",
    body: "Our AI scopes and prices it in ZAR, then a certified African engineering team builds the system you'll own.",
  },
  {
    n: "03",
    title: "It stays alive",
    body: "We keep it monitored and improving as your seasons, crops, and buyers change. The system grows with you.",
  },
];

export function AgriHowItWorks() {
  return (
    <section className="relative overflow-hidden px-6 py-20 lg:py-24">
      <motion.div
        className="agri-glass-dark relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        {/* Background glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-lime-400/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="agri-grid pointer-events-none absolute inset-0 opacity-[0.08]" />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="cue text-lime-300">How it works</p>
            <h2 className="mt-2 max-w-xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              From a plain-language problem to a{" "}
              <span className="bg-gradient-to-r from-lime-300 to-emerald-300 bg-clip-text text-transparent">
                living system
              </span>
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: EASE }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
              >
                <span className="font-display text-3xl font-bold text-lime-300/90">
                  {step.n}
                </span>
                <h3 className="mt-3 font-ui text-lg font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-50/75">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
