"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const METRICS = [
  { value: "Farm → Shelf", label: "Full chain visibility, end to end" },
  { value: "6", label: "Countries live across Africa" },
  { value: "Offline-first", label: "Built for patchy rural connectivity" },
  { value: "24/7", label: "AI monitoring keeps systems alive" },
];

export function AgriMetrics() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: EASE }}
            >
              <div className="text-agri-gradient font-serif text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight">
                {m.value}
              </div>
              <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-emerald-500 lg:mx-0" />
              <p className="mt-3 text-sm text-emerald-900/60 leading-relaxed">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
