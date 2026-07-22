"use client";

import { Droplets, MapPin, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const EASE = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  { icon: Droplets, text: "Field-grade data capture that works offline and syncs later" },
  { icon: MapPin, text: "Geo-tagged plots, batches, and movements across the chain" },
  { icon: Sprout, text: "Tuned to local crops, seasons, and export requirements" },
];

export function AgriGroundTruth() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28 bg-white">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Left side — text content */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="cue text-emerald-600">Built for the ground truth</p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Designed for real farms, real roads,{" "}
            <span className="text-agri-gradient">real markets</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-900/70">
            Smallholder networks, patchy signal, mixed paperwork, and buyers who
            demand proof. We design for that reality — offline-first capture, simple
            interfaces for field teams, and clean data your buyers and auditors
            trust.
          </p>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((row, i) => {
              const Icon = row.icon;
              return (
                <motion.li
                  key={row.text}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: EASE }}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-emerald-900/80">
                    {row.text}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        {/* Right side — image + quote card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="space-y-5"
        >
          {/* Image card */}
          <div className="relative overflow-hidden rounded-3xl aspect-[16/10]">
            <Image
              alt="African farm with modern data tracking systems"
              src="/images/agriculture/banana-plantation.png"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent" />
          </div>

          {/* Quote card */}
          <div className="agri-glass relative overflow-hidden rounded-3xl p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-lime-400/25 blur-3xl" />
            <blockquote className="relative">
              <p className="font-body text-xl font-semibold leading-snug text-emerald-950">
                &ldquo;If you can prove where it came from and how it was handled, you
                can sell it anywhere. That proof is what we build.&rdquo;
              </p>
              <footer className="mt-5 text-sm font-semibold text-emerald-700">
                The Somahorse.ai approach to agriculture
              </footer>
            </blockquote>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
