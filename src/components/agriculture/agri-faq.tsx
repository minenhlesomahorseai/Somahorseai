"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const FAQS = [
  {
    question: "How does Somahorse.ai handle poor rural connectivity?",
    answer:
      "Offline-first design is our default. Field tools capture data without signal and sync when connectivity returns, so weighbridges, packhouses, and remote farms keep working regardless of network conditions. Data integrity is preserved through conflict-free replication.",
  },
  {
    question: "What crops and supply chains do you support?",
    answer:
      "We build custom systems tuned to your specific crops, seasons, and export requirements — from bananas and citrus to avocados, macadamia, and mixed fresh produce. Each system is designed for the real conditions your supply chain operates in.",
  },
  {
    question: "How does produce traceability work?",
    answer:
      "Every crate, batch, and shipment is tracked from the field through packhouse to the buyer. QR codes, geo-tags, and timestamped events create an immutable chain of custody that satisfies retailers, regulators, and export auditors.",
  },
  {
    question: "Is GlobalG.A.P. and export compliance included?",
    answer:
      "Yes — compliance documentation is generated as you work, not assembled at audit time. GlobalG.A.P., food-safety, and export records are structured from day one, keeping you permanently audit-ready.",
  },
  {
    question: "What happens after the system is built?",
    answer:
      "Our Monitoring Agent runs continuous telemetry, self-healing scripts, and maintenance for a predictable monthly fee. It catches drift, patches minor bugs, and escalates anything it can't fix itself — your system stays alive and improves with each season.",
  },
] as const;

export function AgriFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="agri-faq" className="relative overflow-hidden px-4 sm:px-8 lg:px-12 py-20 sm:py-28 bg-white">
      <div className="pointer-events-none absolute -top-20 right-[10%] size-[420px] rounded-full bg-emerald-400/8 blur-[140px]" />

      <motion.div
        className="relative mx-auto max-w-3xl"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <div className="mb-12 sm:mb-16 text-center">
          <p className="cue text-emerald-600 mb-4">
            Answers, up front
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-semibold text-emerald-950"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-emerald-600/60 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-emerald-500" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px] border-t border-emerald-200/40" : "max-h-0"
                  } overflow-hidden`}
                >
                  <p className="px-6 py-5 text-sm leading-relaxed text-emerald-900/70">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
