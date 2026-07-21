"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function PricingHero() {
  return (
    <section className="relative isolate overflow-hidden px-2 pb-20 pt-3 sm:px-3">
      <div className="hero-field absolute inset-x-2 bottom-4 top-2 -z-10 overflow-hidden rounded-[26px] border border-border shadow-calm sm:inset-x-3 md:rounded-[36px]">
        <div className="dotted-grid absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-[30%] size-[78vw] max-h-[760px] max-w-[1020px] -translate-x-1/2 rounded-full bg-blue-vivid/10 blur-[130px] animate-glow-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[60svh] max-w-4xl flex-col items-center justify-center px-4 pt-28 pb-16 text-center sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-navy-mid/15 bg-white/70 px-4 py-1.5 text-xs font-semibold text-navy-mid backdrop-blur"
        >
          <span className="size-2 rounded-full bg-blue-vivid animate-glow-pulse" />
          Transparent pricing for African agriculture
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="h-hero max-w-4xl text-balance"
        >
          Simple, <span className="text-gradient">scalable</span> pricing
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          className="lead mt-6 max-w-2xl"
        >
          From quick prototypes to enterprise solutions. Choose the tier that fits your
          agricultural project needs. Developers earn 60% of project fees.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-accent-teal" />
            <span>No hidden fees</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-accent-teal" />
            <span>60% developer revenue share</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-accent-teal" />
            <span>Monthly monitoring available</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
