import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { getMarketingUser } from "@/lib/auth/marketing";
import { DeveloperFAQ } from "./developer-faq";
import { DeveloperHeroClient } from "./developer-hero-client";
import { ArrowUpRight, ArrowRight, UserPlus, ClipboardCheck, MessageSquareCode, PartyPopper, Coins, Cpu, Eye, GitPullRequest } from "lucide-react";

export const metadata: Metadata = {
  title: "Join our Developer Network — Somahorse.ai",
  description: "Build robust AI infrastructure and software for African agricultural supply chains. Apply to join our vetted developer network today.",
};

const BENEFITS = [
  {
    icon: Cpu,
    title: "AI-Powered Scoping",
    desc: "No more ambiguous requirements. Our AI engine scopes agricultural problems into clear, structured milestones so you can focus strictly on writing great code.",
  },
  {
    icon: Coins,
    title: "Milestone Escrow Payouts",
    desc: "All projects are fully funded in escrow before development starts. Get weekly payouts automatically approved and paid out as soon as code passes testing.",
  },
  {
    icon: GitPullRequest,
    title: "Automated DevOps Loop",
    desc: "Deploy code and let our automated AI system handle telemetry, deployment, and minor bug patching. Sleep peacefully without production crash alerts.",
  },
  {
    icon: Eye,
    title: "Impactful Work",
    desc: "Build software that keeps critical food logistics moving. Track weights, manage distributors, coordinate cooperative farmers, and improve livelihood transparency.",
  },
] as const;

const PIPELINE = [
  {
    step: "01",
    title: "Apply & Scoping",
    desc: "Create an account, specify your tech stack (Next.js, Python, PostgreSQL, APIs), and link your GitHub profile. Our team reviews profile applications within 48 hours.",
    icon: UserPlus,
    badgeColor: "bg-talent/10 text-talent",
  },
  {
    step: "02",
    title: "Technical Sandbox",
    desc: "Complete a custom coding assignment simulating real agricultural logistics (e.g. offline-first inventory syncing, offline coordinate mapping, or supply-chain queues).",
    icon: ClipboardCheck,
    badgeColor: "bg-accent-teal/15 text-accent-teal",
  },
  {
    step: "03",
    title: "Live Review",
    desc: "A 45-minute live technical and architecture interview with a core Somahorse system builder to discuss your assessment, tech decisions, and workflow.",
    icon: MessageSquareCode,
    badgeColor: "bg-accent-amber/15 text-accent-amber",
  },
  {
    step: "04",
    title: "Certified Onboarding",
    desc: "Welcome to the developer network! Get matched with funded projects, deploy code with AI safety nets, and receive automated milestone payouts.",
    icon: PartyPopper,
    badgeColor: "bg-talent-bright/15 text-talent-bright",
  },
] as const;

export default async function DevelopersPage() {
  const user = await getMarketingUser();
  const dashboardHref = user?.dashboardPath ?? null;
  const applyHref = dashboardHref ?? "/signup?role=developer";
  const applyLabel = user
    ? user.role === "client"
      ? "Go to dashboard"
      : "Visit dashboard"
    : null;
  return (
    <>
      <FloatingNav user={user} />
      
      <main className="dev-dark relative min-h-screen overflow-hidden">
        <div className="dev-dark-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />

        {/* ═══════════════════════════════════════════════════════
            HERO SECTION — Split layout with robot
        ═══════════════════════════════════════════════════════ */}
        <section className="dev-hero-section relative pt-24 sm:pt-28 lg:pt-32 overflow-hidden">
          {/* Soft ambient background */}
          <div className="dev-hero-bg" />

          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-6">

              {/* ── Left Column: Copy ── */}
              <div className="relative z-10 flex flex-col items-start pb-12 lg:pb-20">
                {/* "Developers joined" pill */}
                <Link
                  href={applyHref}
                  className="dev-hero-pill group mb-8"
                >
                  <span className="dev-hero-pill-badge">
                    <span className="dev-hero-pill-dot" />
                    500+ developers joined today
                  </span>
                  <span className="dev-hero-pill-cta">
                    Join now <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>

                {/* Main headline */}
                <h1 className="dev-hero-heading">
                  Build the Future
                  <br />
                  of African
                  <br />
                  <span className="text-dev-gradient">Agriculture</span>
                </h1>

                {/* Sub copy */}
                <p className="dev-hero-subtext mt-6 max-w-lg">
                  Join a certified network of software engineers building
                  high-impact tech infrastructure. Get matched with funded
                  supply-chain projects and earn milestone-based payouts.
                </p>

                {/* CTA buttons */}
                <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                  <Link
                    href={applyHref}
                    className="dev-hero-btn-primary"
                  >
                    {applyLabel ?? "Join now"} <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="#pipeline"
                    className="dev-hero-btn-secondary"
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              {/* ── Right Column: Robot Image ── */}
              <div className="relative flex items-end justify-center lg:justify-end">
                {/* Glow behind the robot */}
                <div className="dev-hero-robot-glow" />
                <Image
                  src="/developer-real-robot.png"
                  alt="Futuristic AI robot representing Somahorse developer network"
                  width={620}
                  height={700}
                  className="dev-hero-robot-img"
                  priority
                />
              </div>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <DeveloperHeroClient />
        </section>

        {/* ═══════════════════════════════════════════════════════
            VALUE PROPS
        ═══════════════════════════════════════════════════════ */}
        <section className="relative px-6 py-16 border-t border-border z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="cue text-talent">The Developer Experience</span>
              <h2 className="h-section font-display mt-2">Engineered for builders, backed by AI</h2>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={idx}
                    className="dev-glass group relative rounded-3xl p-6 transition hover:-translate-y-1 duration-300"
                  >
                    <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-talent/10 text-talent mb-5 group-hover:bg-talent group-hover:text-white transition-colors duration-300">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-ui text-base font-bold text-navy mb-2">{benefit.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            PIPELINE STEPPER
        ═══════════════════════════════════════════════════════ */}
        <section id="pipeline" className="relative px-6 py-20 sm:py-28 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="cue text-talent">Onboarding Process</span>
              <h2 className="h-section font-display mt-2">Your journey to joining Somahorse</h2>
              <p className="max-w-xl mx-auto mt-4 text-muted-foreground leading-relaxed">
                We maintain a vetted network of premium engineers. Here is the 4-step pipeline to get certified.
              </p>
            </div>

            <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Stepper Connecting Lines (Desktop only) */}
              <div className="hidden lg:block absolute top-12 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-talent/25 to-transparent -z-10" />

              {PIPELINE.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="dev-glass relative flex flex-col items-start rounded-3xl p-6 sm:p-7">
                    {/* Step badge & icon */}
                    <div className="flex w-full items-center justify-between mb-5">
                      <div className={`flex size-12 items-center justify-center rounded-2xl ${step.badgeColor}`}>
                        <Icon className="size-6" />
                      </div>
                      <span className="font-display text-3xl font-extrabold text-navy/10 leading-none select-none">
                        {step.step}
                      </span>
                    </div>

                    {/* Step Details */}
                    <h3 className="font-ui text-lg font-bold text-navy mb-2.5">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════════════════ */}
        <section id="dev-faq" className="relative px-6 py-20 border-t border-border z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="cue text-talent">Common Inquiries</span>
              <h2 className="h-section font-display mt-2">Frequently Asked Questions</h2>
            </div>
            <DeveloperFAQ />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FINAL CTA
        ═══════════════════════════════════════════════════════ */}
        <section className="relative px-6 py-24 z-10">
          <div className="dev-glass max-w-5xl mx-auto overflow-hidden rounded-[34px] px-6 py-16 text-center sm:px-12 sm:py-20 relative">
            {/* Ambient background blur */}
            <div className="pointer-events-none absolute left-1/2 top-0 size-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-talent-bright/10 blur-[120px]" />
            
            <div className="relative">
              <span className="cue text-talent">Take the first step</span>
              <h2 className="h-section mx-auto max-w-3xl text-balance mt-3">
                Ready to build resilient digital infrastructure?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-muted-foreground leading-relaxed">
                Apply today, pass our logistics coding sandbox, and start earning by solving high-impact supply chain challenges.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center">
                <Link
                  href={applyHref}
                  className="dev-hero-btn-primary w-full sm:w-auto"
                >
                  {applyLabel ?? "Join Network"} <ArrowUpRight className="size-4" />
                </Link>
                <Link
                  href="/"
                  className="dev-hero-btn-secondary w-full sm:w-auto"
                >
                  Back to homepage
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
