"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

const FAQS = [
  { question: "Are the budget bands fixed packages?", answer: "No. They are a simple way to describe the likely scale of a project. Your final ZAR quote is based on the agreed scope, complexity, integrations, delivery plan, and any monitoring requirements." },
  { question: "How is the final project price decided?", answer: "You describe the problem in plain language, the platform turns it into an initial structured scope, and the plan is refined before a quote is approved. You can review the build fee, deposit, milestones, and monthly monitoring amount before paying." },
  { question: "Do I pay the entire build fee upfront?", answer: "No. The start payment is approximately one-third of the build fee. The remaining build amount is staged through the project’s delivery milestones, so payments stay connected to visible progress." },
  { question: "When does monthly monitoring begin?", answer: "Only after the system is live, and only when monitoring is included in the approved quote. Its amount is shown separately from the build fee." },
  { question: "How are payments processed?", answer: "Checkout is handled securely through Paddle. Successful payments and invoice details are then recorded against the relevant project in the platform." },
  { question: "What does the 60/40 allocation mean?", answer: "For each verified client payment, 60% is assigned to the project’s talent pool and 40% to the platform. Talent allocations remain visible as owed until an admin records the payout as paid." },
  { question: "Can the scope change after the project starts?", answer: "A meaningful scope change may affect milestones, delivery timing, or price. It should be reviewed and agreed before it becomes part of the active delivery plan." },
] as const;

export function PricingFAQ({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(17rem,0.48fr)_minmax(0,0.8fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-mist px-3 py-1.5 text-[11px] font-bold text-blue-vivid">
            <HelpCircle className="size-3.5" aria-hidden /> Pricing FAQ
          </div>
          <h2 className="mt-5 text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">The useful details, without the small print maze.</h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">If your project has unusual commercial or delivery requirements, start the scope and give us the context.</p>
          <Link href={ctaHref} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-navy-mid px-5 text-sm font-bold text-white transition hover:bg-navy">
            Start a project <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => <FAQItem key={faq.question} faq={faq} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, index }: { faq: (typeof FAQS)[number]; index: number }) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <motion.article initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, ease: EASE, delay: index * 0.035 }} className="overflow-hidden rounded-2xl border border-border/80 bg-white/80 shadow-soft backdrop-blur-xl">
      <h3>
        <button type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-blue-mist/35 sm:px-6">
          <span className="text-sm font-bold text-navy sm:text-base">{faq.question}</span>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-mist text-navy-mid">
            <ChevronDown className="size-4" aria-hidden />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }}>
            <p className="px-5 pb-5 text-sm leading-7 text-muted-foreground sm:px-6 sm:pb-6">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
