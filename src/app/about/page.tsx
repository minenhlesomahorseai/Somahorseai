import type { Metadata } from "next";
import Link from "next/link";
import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { getMarketingUser } from "@/lib/auth/marketing";
import {
  ArrowRight,
  Bot,
  Compass,
  Cpu,
  Globe2,
  HeartHandshake,
  Leaf,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Somahorse.ai",
  description:
    "Somahorse.ai is an AI-run software agency building resilient digital infrastructure for African agricultural supply chains — meet the team behind it.",
};

const VALUES = [
  {
    icon: Bot,
    title: "AI runs the pipeline",
    desc: "From plain-language intake to scoping, pricing, matching, and monitoring — an AI engine orchestrates the entire delivery loop end to end.",
  },
  {
    icon: ShieldCheck,
    title: "Provable trust",
    desc: "Escrowed budgets, milestone-gated payouts, and transparent progress tracking. Nobody moves money until the work is verified.",
  },
  {
    icon: Leaf,
    title: "Agriculture first",
    desc: "We specialize in farm-to-shelf logistics: weighbridge tracking, cooperative coordination, offline-first field tools, and traceability.",
  },
  {
    icon: Globe2,
    title: "African engineering",
    desc: "A vetted network of certified African software engineers, matched to funded projects and backed by automated AI safety nets.",
  },
  {
    icon: Radar,
    title: "Always-on monitoring",
    desc: "Software isn't done at launch. Telemetry, self-healing scripts, and continuous maintenance keep production systems alive.",
  },
  {
    icon: HeartHandshake,
    title: "Livelihood impact",
    desc: "Every system we ship keeps food moving and makes value chains more transparent for the farmers who power them.",
  },
] as const;

const TEAM = [
  {
    name: "Eric",
    role: "Founder & CEO",
    bio: "Systems architect behind the Somahorse vision — turning plain-language agricultural problems into funded, running software.",
    initials: "ER",
    accent: "from-blue-vivid to-blue-sky",
  },
  {
    name: "Naledi",
    role: "Head of AI Engineering",
    bio: "Leads the scoping and matching engine that translates client briefs into structured, priced project milestones.",
    initials: "NA",
    accent: "from-violet-500 to-blue-vivid",
  },
  {
    name: "Kwame",
    role: "Platform Lead",
    bio: "Owns the delivery pipeline — escrow, milestone tracking, and the automated DevOps loop developers rely on.",
    initials: "KW",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    name: "Amara",
    role: "Head of Talent Network",
    bio: "Curates and certifies our engineer network, running the technical sandbox and live review pipeline.",
    initials: "AM",
    accent: "from-amber-500 to-orange-400",
  },
  {
    name: "Tunde",
    role: "Agri Supply-Chain Lead",
    bio: "Former logistics operator who keeps our products honest — from weighbridge tickets to cold-chain telemetry.",
    initials: "TU",
    accent: "from-sky-500 to-cyan-400",
  },
  {
    name: "Zanele",
    role: "Design & Experience",
    bio: "Designs the interfaces that make heavy agricultural software feel effortless on a farm phone or a boardroom screen.",
    initials: "ZA",
    accent: "from-pink-500 to-violet-400",
  },
] as const;

const STATS = [
  { value: "500+", label: "Certified developers" },
  { value: "50+", label: "Funded projects" },
  { value: "98%", label: "Payout success" },
  { value: "24/7", label: "AI monitoring" },
] as const;

export default async function AboutPage() {
  const user = await getMarketingUser();
  return (
    <>
      <FloatingNav user={user} />

      <main className="about-dark relative min-h-screen overflow-hidden">
        {/* Ambient orbs */}
        <div className="about-orb -top-32 left-[10%] size-[420px] bg-blue-vivid/10" aria-hidden />
        <div className="about-orb top-[40%] right-[-8%] size-[380px] bg-violet-500/8" aria-hidden />
        <div className="about-orb bottom-[-10%] left-[30%] size-[420px] bg-blue-sky/8" aria-hidden />
        <div className="cta-dark-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        {/* ── Hero ── */}
        <section className="relative z-10 px-6 pt-32 pb-16 sm:pt-40 sm:pb-24 text-center">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-mid/15 bg-blue-light px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-navy-mid backdrop-blur-md font-ui">
              <Sparkles className="size-3.5" aria-hidden />
              About Somahorse.ai
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              The AI-run software agency for{" "}
              <span className="text-gradient">African agriculture</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Clients describe a problem in plain language. Our AI scopes it, prices it,
              funds it in escrow, and matches it to certified African engineers — then
              keeps the shipped software alive with continuous monitoring.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-navy-mid px-8 text-sm font-semibold text-white shadow-glow transition hover:bg-navy font-ui"
              >
                Join the platform <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/70 px-8 text-sm font-semibold text-navy backdrop-blur-md transition hover:bg-blue-mist font-ui"
              >
                Explore the platform
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="relative z-10 px-6 pb-16">
          <div className="about-glass mx-auto grid max-w-4xl grid-cols-2 gap-6 rounded-3xl p-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground font-ui">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="relative z-10 px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <div className="about-glass rounded-3xl p-8 sm:p-10">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-blue-vivid/10 text-blue-vivid">
                <Compass className="size-5" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-navy sm:text-3xl">Our mission</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Critical food logistics across Africa still run on paper, phone calls, and
                spreadsheets. We exist to close that gap — making world-class custom software
                accessible to agricultural enterprises of every size, without the ambiguity,
                risk, and overhead of traditional agencies.
              </p>
            </div>
            <div className="about-glass rounded-3xl p-8 sm:p-10">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
                <Cpu className="size-5" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-navy sm:text-3xl">How we work</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                An AI engine sits at the center of everything: it interviews the client,
                writes the scope, prices the milestones, matches the right certified
                engineers, watches the code ship, and then monitors production around the
                clock — auto-repairing what it can and escalating what it can&apos;t.
              </p>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="relative z-10 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="cue text-navy-mid">What we believe</span>
              <h2 className="h-section mt-2 font-display">Principles that run the platform</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VALUES.map((value) => {
                const Icon = value.icon;
                return (
                  <div
                    key={value.title}
                    className="about-glass group rounded-3xl p-7 transition duration-300 hover:-translate-y-1"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-blue-vivid/10 text-blue-vivid transition-colors duration-300 group-hover:bg-blue-vivid group-hover:text-white">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-ui text-base font-bold text-navy">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="relative z-10 px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="cue text-navy-mid">The people</span>
              <h2 className="h-section mt-2 font-display">Meet the team of six</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                A small crew with one obsession: keeping Africa&apos;s food supply chains
                running on software that never sleeps.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="about-glass group rounded-3xl p-7 text-center transition duration-300 hover:-translate-y-1"
                >
                  <span
                    aria-hidden
                    className={`mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br font-display text-xl font-bold text-white shadow-glow ${member.accent}`}
                  >
                    {member.initials}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-navy">{member.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-blue-vivid font-ui">
                    {member.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative z-10 px-6 pb-24">
          <div className="about-glass mx-auto max-w-4xl rounded-[34px] p-10 text-center sm:p-14">
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              Want to build with us?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Whether you&apos;re an agricultural enterprise with a problem to solve or an
              engineer ready to join the network — there&apos;s a seat for you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup?role=client"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-client px-8 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 font-ui sm:w-auto"
              >
                Start a project
              </Link>
              <Link
                href="/signup?role=developer"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-talent px-8 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 font-ui sm:w-auto"
              >
                Join as a developer
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
