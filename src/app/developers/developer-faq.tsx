"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Which kinds of developers can apply?",
    answer: "We welcome frontend, backend, full-stack, mobile, data, AI, DevOps, and product-focused builders. Your profile records your primary role and skills so matching can place you on work that fits your strongest capabilities.",
  },
  {
    question: "How are projects and tasks organised?",
    answer: "Each funded project receives a shared workspace. The accepted scope is converted into milestones and tasks, progress updates as the team completes work, and the client sees the same delivery status in plain language.",
  },
  {
    question: "How do earnings work?",
    answer: "After a client payment is verified, 60% is allocated to the project's talent pool. For a multi-person project, that pool is split across the assigned team. Your dashboard clearly separates amounts owed to you from payouts that the Somahorse admin has marked as paid.",
  },
  {
    question: "What does the certification process involve?",
    answer: "You complete your talent profile and a practical assessment, followed by review and, where required, an interview. The process looks at technical judgement, delivery quality, communication, and how well you handle real operating constraints.",
  },
  {
    question: "How do clients and developers communicate?",
    answer: "Every project has a secure participant-only conversation shared by the client, assigned talent, and Somahorse administrators. Messages, unread counts, notifications, and read receipts update in realtime without refreshing the dashboard.",
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
            className="developer-panel overflow-hidden rounded-2xl transition"
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
                isOpen ? "max-h-[360px] border-t border-border" : "max-h-0"
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
