"use client";

import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

const FAQS = [
  {
    question: "Which tier should I choose?",
    answer:
      "Basic is ideal for quick prototypes and MVPs. Standard is our most popular tier for full-featured agricultural solutions. Premium is best for complex enterprise deployments requiring dedicated support. Enterprise is for large-scale networks needing custom solutions and SLAs.",
  },
  {
    question: "Do you offer an enterprise package or SLAs?",
    answer:
      "Yes, our Enterprise tier includes custom SLAs, dedicated success teams, white-label solutions, and custom contracts. Contact our sales team to discuss your specific requirements and get a tailored solution.",
  },
  {
    question: "How does the 60/40 revenue split work?",
    answer:
      "Developers receive 60% of the project fee, while Somahorse.ai retains 40% for platform operations, AI infrastructure, support, and ongoing development. For example, on a $5,000 Standard project, developers earn $3,000.",
  },
  {
    question: "What's included in monthly monitoring?",
    answer:
      "Monthly monitoring includes drift detection, health watches, performance analytics, and proactive alerts to ensure your agricultural systems continue operating optimally. Pricing varies based on project complexity and monitoring requirements.",
  },
  {
    question: "How are projects scoped and priced?",
    answer:
      "Our AI analyzes your plain-language description to scope the project, estimate complexity, and recommend appropriate pricing tiers. You can then adjust the scope or discuss with our team to finalize the project details.",
  },
  {
    question: "Can I upgrade between tiers?",
    answer:
      "Yes, you can start with any tier and upgrade as your project grows. Many teams begin with Basic for prototyping, then move to Standard or Premium for full deployment. We'll help you transition smoothly.",
  },
  {
    question: "What support levels are available?",
    answer:
      "Basic includes email support. Standard adds Slack support. Premium provides 24/7 priority support with SLA guarantees. Enterprise customers get a dedicated success team and custom support arrangements.",
  },
  {
    question: "Are there additional costs beyond the project fee?",
    answer:
      "The project fee covers development, delivery, and initial deployment. Monthly monitoring fees are separate and depend on your needs. There are no hidden fees—everything is transparent upfront.",
  },
];

function FAQItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-white/80 shadow-soft backdrop-blur-sm"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-blue-mist/50"
      >
        <span className="font-ui font-semibold text-navy">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-mid/10"
        >
          <ChevronDown className="size-4 text-navy-mid" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PricingFAQ() {
  return (
    <section className="px-2 py-24 sm:px-3">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-mist px-4 py-2">
            <HelpCircle className="size-4 text-navy-mid" />
            <span className="cue text-navy-mid">FAQ</span>
          </div>
          <h2 className="h-section">Frequently asked questions</h2>
          <p className="lead mx-auto mt-4 max-w-2xl">
            Everything you need to know about our pricing, revenue model, and how we work with
            developers to build agricultural solutions.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <FAQItem key={faq.question} faq={faq} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
          className="mt-12 rounded-3xl border border-navy-mid/20 bg-gradient-to-br from-navy-mid/5 to-blue-mist p-8 text-center"
        >
          <h3 className="font-ui text-xl font-bold text-navy">Still have questions?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team is here to help you find the right solution for your agricultural project.
          </p>
          <button className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy font-ui">
            Contact support
          </button>
        </motion.div>
      </div>
    </section>
  );
}
