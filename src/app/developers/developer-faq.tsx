"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What tech stack do Somahorse developers use?",
    answer: "We primarily build with modern, scalable stacks. This includes Next.js, React, TypeScript, TailwindCSS, Node.js, Python (FastAPI/Django), and PostgreSQL. Many projects also involve integrating AI models (like Gemini, GPT-4, and Claude) and handling offline-first local database synchronizations for remote agricultural areas.",
  },
  {
    question: "How do milestones and payments work?",
    answer: "Somahorse.ai uses automated milestone tracking. Before work starts, the project budget is secured in escrow. When you submit a pull request and it passes automated tests and the AI monitoring validation loop, the milestone is approved, and payouts are sent directly to your linked bank account or wallet.",
  },
  {
    question: "What does the technical assessment look like?",
    answer: "The assessment is a real-world coding sandbox. You will be given a small, scoped agricultural project requirement (e.g., building a mobile-responsive supply-chain tracking dashboard or writing an offline sync service for weight tickets). We evaluate code architecture, TypeScript types, responsive UI, and clean data modeling.",
  },
  {
    question: "Can I work freelance or part-time?",
    answer: "Absolutely! Projects on our network are scoped by hours (ranging from 10 to 40 hours per week). When you join, you can specify your availability and only apply to scoping projects that align with your schedule.",
  },
  {
    question: "What is the AI maintenance loop?",
    answer: "Once a project is built and deployed, the Somahorse.ai monitoring system runs continuous integration, telemetry, and self-healing scripts. If there are API crashes or minor bugs in production, our system attempts to auto-repair them or opens clear issues for developers to address, removing the DevOps headache.",
  },
];

export function DeveloperFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="dev-glass overflow-hidden rounded-2xl transition"
          >
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between px-6 py-5 text-left font-ui text-base font-bold text-navy"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={`size-5 text-talent/60 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-talent" : ""
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[300px] border-t border-border" : "max-h-0"
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
  );
}
