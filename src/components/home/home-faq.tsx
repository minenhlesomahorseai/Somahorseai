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
    <section id="faq" className="relative overflow-hidden px-5 py-20 sm:py-24">
      <div className="dotted-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-20 right-[10%] size-[420px] rounded-full bg-blue-sky/10 blur-[140px]" />

      <Reveal className="relative mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <span className="cue text-navy-mid">Answers, up front</span>
          <h2 className="h-section mt-2 font-display">Frequently asked questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="faq-glass overflow-hidden rounded-2xl">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left font-ui text-base font-bold text-navy"
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
                    isOpen ? "max-h-[300px] border-t border-border/60" : "max-h-0"
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
