"use client";

import {
  Boxes,
  LineChart,
  Radio,
  ScanLine,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

type Solution = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const SOLUTIONS: Solution[] = [
  {
    icon: ScanLine,
    title: "Produce traceability",
    body: "Track every crate from farm to shelf — origin, handling, and quality, provable to any retailer or regulator on demand.",
  },
  {
    icon: LineChart,
    title: "Yield & demand forecasting",
    body: "Turn seasons of field data into forecasts you can plan against — what to plant, how much, and when buyers will want it.",
  },
  {
    icon: Truck,
    title: "Logistics & cold chain",
    body: "Coordinate harvest, transport, and storage so less is lost between the field and the customer. Catch cold-chain breaks before spoilage.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & certification",
    body: "GlobalG.A.P., export, and food-safety records generated as you work — audit-ready, not a scramble at inspection time.",
  },
  {
    icon: Boxes,
    title: "Unified data platform",
    body: "Pull farm, packhouse, and market data into one structured system that your team — and our AI — can actually use.",
  },
  {
    icon: Radio,
    title: "Live monitoring",
    body: "Once your system is live, our Monitoring Agent watches it, flags drift, and keeps it healthy for a predictable monthly fee.",
  },
];

function SolutionCard({ item, index }: { item: Solution; index: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
      className="agri-glass group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/30">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-5 font-ui text-lg font-bold text-emerald-950">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-emerald-900/70">
        {item.body}
      </p>
    </motion.div>
  );
}

export function AgriSolutions() {
  return (
    <section id="solutions" className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28 bg-white">
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className="cue text-emerald-600">What we do for agriculture</p>
        <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl lg:text-5xl">
          One platform for the whole value chain
        </h2>
        <p className="mt-4 text-base leading-relaxed text-emerald-900/70">
          Every solution is a system you own, built by certified engineers and kept
          alive by our AI. Start with one problem — extend across your whole
          operation over time.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS.map((item, i) => (
          <SolutionCard key={item.title} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
