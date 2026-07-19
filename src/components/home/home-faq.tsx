"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./reveal";

const FAQS = [
  {
    question: "How does the AI scope my project?",
    answer:
      "You describe your agricultural problem in plain language — the same way you'd explain it to a colleague. Our Intake Agent interviews you, structures the requirements into milestones, and returns a fixed, priced scope in ZAR before any work begins.",
  },
  {
    question: "Who actually builds the software?",
    answer:
      "Certified African software engineers from our vetted network. Every developer passes a technical sandbox assessment and a live architecture review before joining. The AI matches the right engineers to your project's stack and domain.",
  },
  {
    question: "How is my money protected?",
    answer:
      "Your budget is secured in escrow before development starts. Funds are only released as milestones pass automated testing and AI validation — nobody moves money until the work is verified.",
  },
  {
    question: "What happens after the software ships?",
    answer:
      "It stays alive. Our Monitoring Agent runs continuous telemetry, self-healing scripts, and maintenance for a predictable monthly fee — catching drift, patching minor bugs, and escalating anything it can't fix itself.",
  },
  {
    question: "Does it work with poor rural connectivity?",
    answer:
      "Yes — offline-first design is our default. Field tools capture data without signal and sync when connectivity returns, so weighbridges, packhouses, and remote farms keep working regardless of network conditions.",
  },
] as const;

export function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative overflow-hidden px-4 sm:px-8 lg:px-12 py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-20 right-[10%] size-[420px] rounded-full bg-blue-sky/8 blur-[140px]" />

      <Reveal className="relative mx-auto max-w-3xl">
        <div className="mb-12 sm:mb-16 text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Answers, up front
          </p>
          <h2 className="h-section">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-blue-vivid/20"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-semibold text-navy"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-navy-mid/60 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-vivid" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px] border-t border-border/40" : "max-h-0"
                  } overflow-hidden`}
                >
                  <p className="px-6 py-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
