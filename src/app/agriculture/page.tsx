import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Droplets,
  LineChart,
  Leaf,
  MapPin,
  Radio,
  ScanLine,
  ShieldCheck,
  Sprout,
  Truck,
} from "lucide-react";

import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { getMarketingUser } from "@/lib/auth/marketing";

export const metadata: Metadata = {
  title: "Agriculture — Somahorse.ai",
  description:
    "AI infrastructure built for African agriculture: produce traceability, yield forecasting, logistics, farm-to-shelf compliance, and live monitoring.",
};

const SOLUTIONS = [
  {
    icon: ScanLine,
    title: "Produce traceability",
    body: "Track every crate from farm to shelf — origin, handling, and quality, provable to any retailer or regulator on demand.",
  },
  {
    icon: LineChart,
    title: "Yield & demand forecasting",
    body: "Turn seasons of field data into forecasts you can plan against — what to plant, how much, and when buyers will want it.",
  },
  {
    icon: Truck,
    title: "Logistics & cold chain",
    body: "Coordinate harvest, transport, and storage so less is lost between the field and the customer. Catch cold-chain breaks before spoilage.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & certification",
    body: "GlobalG.A.P., export, and food-safety records generated as you work — audit-ready, not a scramble at inspection time.",
  },
  {
    icon: Boxes,
    title: "Unified data platform",
    body: "Pull farm, packhouse, and market data into one structured system that your team — and our AI — can actually use.",
  },
  {
    icon: Radio,
    title: "Live monitoring",
    body: "Once your system is live, our Monitoring Agent watches it, flags drift, and keeps it healthy for a predictable monthly fee.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the problem",
    body: "Tell us, in plain language, what's slowing your operation down — patchy connectivity, lost produce, failed audits, blind forecasting.",
  },
  {
    n: "02",
    title: "We scope & build",
    body: "Our AI scopes and prices it in ZAR, then a certified African engineering team builds the system you'll own.",
  },
  {
    n: "03",
    title: "It stays alive",
    body: "We keep it monitored and improving as your seasons, crops, and buyers change. The system grows with you.",
  },
];

const STATS = [
  { value: "Farm → shelf", label: "Full chain visibility" },
  { value: "6 markets", label: "SA · Nigeria · Kenya · Egypt · Morocco · Ghana" },
  { value: "Offline-first", label: "Built for patchy rural connectivity" },
];

export default async function AgriculturePage() {
  const user = await getMarketingUser();
  const primaryCta =
    user?.role === "client" && user.startProjectPath
      ? { href: user.startProjectPath, label: "Start a project" }
      : user
        ? { href: user.dashboardPath, label: "Go to your dashboard" }
        : { href: "/signup", label: "Start a project" };

  return (
    <>
      <FloatingNav user={user} />
      <main className="relative overflow-hidden bg-white text-emerald-950">
        {/* ── Hero — banner backdrop ── */}
        <section className="relative overflow-hidden">
          <Image
            src="/agriculture-banner.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/65 to-emerald-950/85" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/70 via-transparent to-transparent" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-32 sm:pt-36 lg:pb-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-lime-300 backdrop-blur font-ui">
              <Leaf className="size-3.5" aria-hidden />
              Somahorse.ai for Agriculture
            </span>

            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Software that proves{" "}
              <span className="bg-gradient-to-r from-lime-300 via-emerald-300 to-lime-200 bg-clip-text text-transparent">
                every harvest
              </span>{" "}
              — from soil to shelf.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-emerald-50/85">
              African agriculture runs on trust, timing, and traceability. We build the
              AI infrastructure that makes all three provable — so growers, packhouses,
              and exporters can move faster with confidence, even where connectivity is
              thin.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={primaryCta.href}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-500 px-7 text-sm font-bold text-white shadow-[0_18px_40px_-14px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400 font-ui"
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
            </div>

            <dl className="mt-14 grid gap-4 sm:grid-cols-3">
              {STATS.map((s) => (
                <div
                  key={s.value}
                  className="rounded-2xl border border-white/15 bg-emerald-950/45 px-5 py-5 backdrop-blur-md"
                >
                  <dt className="font-display text-xl font-bold text-lime-300">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-sm text-emerald-50/75">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Solutions ── */}
        <section id="solutions" className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="cue text-emerald-600">What we do for agriculture</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
              One platform for the whole value chain
            </h2>
            <p className="mt-4 text-base leading-relaxed text-emerald-900/70">
              Every solution is a system you own, built by certified engineers and kept
              alive by our AI. Start with one problem — extend across your whole
              operation over time.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="agri-glass group rounded-3xl p-6 transition hover:-translate-y-1"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/30">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-ui text-lg font-bold text-emerald-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-900/70">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How it works band ── */}
        <section className="relative overflow-hidden px-6 py-20 lg:py-24">
          <div className="agri-glass-dark relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12">
            <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-lime-400/20 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-emerald-400/20 blur-[120px]" />
            <div className="relative">
              <p className="cue text-lime-300">How it works</p>
              <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                From a plain-language problem to a living system
              </h2>

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                {STEPS.map((step) => (
                  <div key={step.n}>
                    <span className="font-display text-3xl font-bold text-lime-300/90">
                      {step.n}
                    </span>
                    <h3 className="mt-3 font-ui text-lg font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-50/75">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Ground-truth / context ── */}
        <section className="relative mx-auto max-w-6xl px-6 pb-8 lg:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="cue text-emerald-600">Built for the ground truth</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
                Designed for real farms, real roads, real markets
              </h2>
              <p className="mt-4 text-base leading-relaxed text-emerald-900/70">
                Smallholder networks, patchy signal, mixed paperwork, and buyers who
                demand proof. We design for that reality — offline-first capture, simple
                interfaces for field teams, and clean data your buyers and auditors
                trust.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Droplets, text: "Field-grade data capture that works offline and syncs later" },
                  { icon: MapPin, text: "Geo-tagged plots, batches, and movements across the chain" },
                  { icon: Sprout, text: "Tuned to local crops, seasons, and export requirements" },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.text} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="text-sm leading-relaxed text-emerald-900/80">
                        {row.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

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
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative px-6 py-20 lg:py-28">
          <div className="agri-field relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-emerald-600/15 px-6 py-16 text-center sm:px-12">
            <div className="agri-grid pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
                Let&apos;s build the system your harvest deserves
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-emerald-900/70">
                Describe your agricultural challenge in plain language. We&apos;ll scope
                it, price it, and build it — and keep it running.
              </p>
              <Link
                href={primaryCta.href}
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-600 px-8 text-sm font-bold text-white shadow-[0_18px_40px_-14px_rgba(5,150,105,0.7)] transition hover:bg-emerald-700 font-ui"
              >
                {primaryCta.label}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
