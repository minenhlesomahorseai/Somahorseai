"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Boxes, Building2, Check, FlaskConical, Workflow } from "lucide-react";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

const BUDGETS = [
  {
    range: "Under R250k",
    name: "Proof of concept",
    description: "Validate one important workflow before committing to a larger platform.",
    icon: FlaskConical,
    outcomes: ["Focused problem scope", "Prototype experience", "Core data flow", "Decision-ready next step"],
    accent: "bg-blue-mist text-blue-vivid",
  },
  {
    range: "R250k–R1m",
    name: "Focused build",
    description: "Turn a proven need into a working product for a defined group of users.",
    icon: Workflow,
    outcomes: ["Core user roles", "Operational workflows", "Essential integrations", "Production deployment"],
    accent: "bg-talent-pale text-talent-blue",
  },
  {
    range: "R1m–R2.5m",
    name: "Full platform",
    description: "Connect teams, complex workflows, reporting, and ongoing operations.",
    icon: Boxes,
    outcomes: ["Multi-role experience", "Connected data systems", "Reporting and controls", "Launch monitoring"],
    accent: "bg-accent-teal/10 text-accent-teal",
  },
  {
    range: "R2.5m+",
    name: "National scale",
    description: "Design for broad adoption, governance, resilience, and continuous delivery.",
    icon: Building2,
    outcomes: ["Multi-region delivery", "Governance requirements", "Resilient infrastructure", "Ongoing roadmap"],
    accent: "bg-navy text-white",
  },
] as const;

export function PricingTiers({ ctaHref }: { ctaHref: string }) {
  return (
    <section id="budget-guide" className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,0.45fr)]">
          <div>
            <p className="cue text-blue-vivid">Budget guide</p>
            <h2 className="mt-3 max-w-4xl text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">Start with the scale of the outcome, not a shelf package.</h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">These bands help us understand ambition and constraints. They are planning guides, not fixed prices—the final quote follows the agreed scope.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUDGETS.map((budget, index) => {
            const Icon = budget.icon;
            return (
              <motion.article
                key={budget.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: EASE, delay: index * 0.06 }}
                className="group flex min-h-full flex-col rounded-[1.75rem] border border-border/80 bg-white/78 p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 hover:border-navy-mid/20 hover:shadow-card sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid size-11 place-items-center rounded-2xl ${budget.accent}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-bold text-navy">{budget.range}</span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-navy">{budget.name}</h3>
                <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{budget.description}</p>
                <ul className="mt-6 space-y-3 border-t border-border/70 pt-5">
                  {budget.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2.5 text-sm text-navy/78">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent-teal" aria-hidden /> {outcome}
                    </li>
                  ))}
                </ul>
                <Link href={ctaHref} className="mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-blue-vivid transition group-hover:gap-2.5">
                  Discuss this scale <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
