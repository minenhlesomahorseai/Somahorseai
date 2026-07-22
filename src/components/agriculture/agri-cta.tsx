"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import type { MarketingUser } from "@/lib/auth/marketing";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AgriCTA({ user = null }: { user?: MarketingUser | null }) {
  const primaryCta =
    user?.role === "client" && user.startProjectPath
      ? { href: user.startProjectPath, label: "Start a project" }
      : user
        ? { href: user.dashboardPath, label: "Go to your dashboard" }
        : { href: "/signup", label: "Start a project" };

  return (
    <section className="relative px-6 py-20 lg:py-28">
      <motion.div
        className="agri-field relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-emerald-600/15 px-6 py-16 text-center sm:px-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="agri-grid pointer-events-none absolute inset-0 opacity-50" />

        {/* Background glows */}
        <div className="pointer-events-none absolute left-1/2 top-0 size-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative">
          <motion.p
            className="cue text-emerald-600 mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            Start with one agricultural problem
          </motion.p>
          <motion.h2
            className="mx-auto max-w-2xl font-serif text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            Let&apos;s build the system your harvest deserves
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-xl text-base text-emerald-900/70"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            Describe your agricultural challenge in plain language. We&apos;ll scope
            it, price it, and build it — and keep it running.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          >
            <Link
              href={primaryCta.href}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 text-sm font-bold text-white shadow-[0_18px_40px_-14px_rgba(5,150,105,0.7)] transition hover:bg-emerald-700 hover:-translate-y-0.5 font-ui"
            >
              {primaryCta.label}
              <ArrowUpRight className="size-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
            <Link
              href="/"
              className="flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-white/80 px-7 text-sm font-semibold text-emerald-900 backdrop-blur-md transition hover:bg-emerald-50 hover:border-emerald-300"
            >
              Back to platform
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
