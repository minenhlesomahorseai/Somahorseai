"use client";

import { ArrowUpRight, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import type { MarketingUser } from "@/lib/auth/marketing";

const EASE = [0.16, 1, 0.3, 1] as const;

const STATS = [
  { value: "Farm → Shelf", label: "Full chain visibility" },
  { value: "6 Markets", label: "SA · Nigeria · Kenya · Egypt · Morocco · Ghana" },
  { value: "Offline-first", label: "Built for patchy rural connectivity" },
];

export function AgriHero({ user = null }: { user?: MarketingUser | null }) {
  const primaryCta =
    user?.role === "client" && user.startProjectPath
      ? { href: user.startProjectPath, label: "Start a project" }
      : user
        ? { href: user.dashboardPath, label: "Go to your dashboard" }
        : { href: "/signup", label: "Start a project" };

  return (
    <section
      aria-label="Agriculture Hero"
      className="relative w-full min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          alt="African banana plantation at golden hour"
          src="/agriculture-banner.jpg"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/55 to-emerald-950/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-transparent to-transparent" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 md:px-8 pt-20">
        {/* Badge pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-lime-300 backdrop-blur font-ui">
            <Leaf className="size-3.5" aria-hidden />
            Somahorse.ai for Agriculture
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="mt-8 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        >
          Software that proves{" "}
          <span className="bg-gradient-to-r from-lime-300 via-emerald-300 to-lime-200 bg-clip-text text-transparent">
            every harvest
          </span>
          <br className="hidden sm:block" />
          — from soil to shelf.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-emerald-50/85"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
        >
          African agriculture runs on trust, timing, and traceability. We build the
          AI infrastructure that makes all three provable — so growers, packhouses,
          and exporters can move faster with confidence, even where connectivity is thin.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
        >
          <Link
            href={primaryCta.href}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-500 px-7 text-sm font-bold text-white shadow-[0_18px_40px_-14px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400 hover:-translate-y-0.5 font-ui"
          >
            {primaryCta.label}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="#solutions"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 font-ui"
          >
            See what we build
          </Link>
        </motion.div>
      </div>

      {/* Stat cards */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-8 mt-14 mb-12"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
      >
        <dl className="grid gap-4 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.value}
              className="rounded-2xl border border-white/15 bg-emerald-950/45 px-5 py-5 backdrop-blur-md transition-all duration-300 hover:bg-emerald-950/60 hover:border-white/25"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.1, duration: 0.6, ease: EASE }}
            >
              <dt className="font-display text-xl font-bold text-lime-300">
                {s.value}
              </dt>
              <dd className="mt-1 text-sm text-emerald-50/75">{s.label}</dd>
            </motion.div>
          ))}
        </dl>
      </motion.div>
    </section>
  );
}
