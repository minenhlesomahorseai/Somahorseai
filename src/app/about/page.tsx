import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Compass,
  Cpu,
  Globe2,
  Layers3,
  MessageCircle,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { Reveal } from "@/components/home/reveal";
import { getMarketingUser } from "@/lib/auth/marketing";

export const metadata: Metadata = {
  title: "About Us — Somahorse.ai",
  description:
    "Meet the people building Somahorse.ai and learn how the platform turns complex African business problems into delivered, monitored software.",
};

const OPERATING_STEPS = [
  { number: "01", icon: Compass, title: "Understand", text: "Start with the real operational problem, not a list of features." },
  { number: "02", icon: BrainCircuit, title: "Structure", text: "Turn the brief into a clear scope, quote, milestones, and delivery plan." },
  { number: "03", icon: UsersRound, title: "Assemble", text: "Match the work with certified African talent and one shared workspace." },
  { number: "04", icon: ShieldCheck, title: "Keep it alive", text: "Track progress through launch and monitor the system after it goes live." },
] as const;

const PRINCIPLES = [
  {
    icon: Layers3,
    title: "Clarity before code",
    text: "A useful build starts with a shared understanding of the problem, the outcome, the price, and what done actually means.",
    className: "lg:col-span-2",
  },
  {
    icon: Globe2,
    title: "Built from Africa",
    text: "African engineers should be trusted with serious systems, meaningful ownership, and transparent participation in the value they create.",
    className: "",
  },
  {
    icon: Cpu,
    title: "AI with a practical job",
    text: "We use AI to reduce ambiguity, coordinate delivery, and surface risk—not to add theatre to the work.",
    className: "",
  },
  {
    icon: Network,
    title: "One connected experience",
    text: "The commercial brief, project team, milestones, messages, and payments belong in one understandable system.",
    className: "lg:col-span-2",
  },
] as const;

const TEAM = [
  { name: "Placeholder Name", role: "Co-Founder & CEO", initials: "PN", accent: "from-blue-vivid via-blue-sky to-talent-bright" },
  { name: "Placeholder Name", role: "Product & Operations", initials: "PN", accent: "from-violet-500 to-blue-vivid" },
  { name: "Placeholder Name", role: "AI Engineering", initials: "PN", accent: "from-cyan-500 to-blue-600" },
  { name: "Placeholder Name", role: "Talent Network", initials: "PN", accent: "from-emerald-500 to-teal-400" },
  { name: "Placeholder Name", role: "Client Delivery", initials: "PN", accent: "from-amber-400 to-orange-500" },
] as const;

const PLATFORM_FACTS = [
  { value: "60%", label: "of verified payments allocated to the project talent pool" },
  { value: "One", label: "shared workspace for progress, people, messages, and money" },
  { value: "ZAR", label: "project quotes shaped around the agreed scope" },
] as const;

export default async function AboutPage() {
  const user = await getMarketingUser();
  const clientHref = user?.startProjectPath ?? user?.dashboardPath ?? "/signup?role=client";
  const talentHref = user?.role === "talent" ? user.dashboardPath : "/signup?role=developer";

  return (
    <>
      <FloatingNav user={user} />

      <main className="about-page relative min-h-screen overflow-hidden">
        <section className="relative isolate px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:px-8">
          <div className="about-grid pointer-events-none absolute inset-0 -z-20 opacity-55" aria-hidden />
          <div className="pointer-events-none absolute -left-36 top-0 -z-10 size-[32rem] rounded-full bg-blue-vivid/10 blur-[130px]" aria-hidden />
          <div className="pointer-events-none absolute -right-40 top-24 -z-10 size-[34rem] rounded-full bg-talent-bright/10 blur-[140px]" aria-hidden />

          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,0.93fr)_minmax(29rem,0.72fr)] lg:gap-16">
            <Reveal className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-blue-vivid">01 / About us</p>
              <h1 className="mt-5 max-w-4xl text-balance font-display text-[clamp(3.35rem,8vw,7.1rem)] font-bold leading-[0.9] tracking-[-0.065em] text-navy">
                We make ambitious software <span className="text-gradient">feel possible.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Somahorse turns complex operational problems into software that can be clearly scoped, responsibly funded, delivered by certified African talent, and kept healthy after launch.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={clientHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy-mid px-6 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-navy">
                  Start a project <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="#our-story" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-strong bg-white/72 px-6 text-sm font-bold text-navy backdrop-blur-xl transition hover:border-navy-mid/25 hover:bg-white">
                  Read our story
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.12} className="relative min-w-0">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-blue-vivid/12 to-talent-bright/10 blur-3xl" aria-hidden />
              <div className="about-system-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-navy p-5 text-white shadow-2xl sm:p-7">
                <div className="about-console-grid pointer-events-none absolute inset-0 opacity-45" aria-hidden />
                <div className="relative flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-sky" />
                    <span className="size-2 rounded-full bg-blue-vivid" />
                    <span className="size-2 rounded-full bg-talent-bright" />
                  </div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Somahorse operating model</span>
                </div>

                <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1.1fr_1fr] sm:grid-rows-2">
                  <SystemNode label="Client" detail="The problem" icon={MessageCircle} className="sm:self-end" />
                  <div className="col-span-2 row-span-2 grid min-h-44 place-items-center rounded-[1.75rem] border border-blue-vivid/30 bg-gradient-to-br from-blue-vivid/24 to-talent-bright/12 p-5 text-center shadow-[0_0_60px_rgba(37,99,235,.18)] sm:col-span-1">
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-blue-sky ring-1 ring-white/10"><Sparkles className="size-5" aria-hidden /></span>
                      <p className="mt-4 font-display text-xl font-bold">One shared system</p>
                      <p className="mt-1 text-[10px] leading-5 text-white/45">Scope · Team · Delivery · Money</p>
                    </div>
                  </div>
                  <SystemNode label="Talent" detail="The build" icon={Code2} className="sm:self-end" />
                  <SystemNode label="AI layer" detail="The structure" icon={BrainCircuit} />
                  <SystemNode label="Control room" detail="The oversight" icon={ShieldCheck} />
                </div>

                <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <span className="relative flex size-3 shrink-0"><span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-teal opacity-60" /><span className="relative inline-flex size-3 rounded-full bg-accent-teal" /></span>
                  <div><p className="text-xs font-bold text-white">From first brief to operating product</p><p className="mt-0.5 text-[10px] text-white/40">Every participant sees the part that matters to them.</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border/70 bg-white/75 px-4 py-6 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-3 sm:divide-x sm:divide-border/80">
            {PLATFORM_FACTS.map((fact) => (
              <div key={fact.value} className="grid grid-cols-[3.75rem_1fr] items-center gap-4 sm:block sm:px-6 sm:text-center first:sm:pl-0 last:sm:pr-0">
                <p className="font-display text-3xl font-bold text-gradient sm:text-4xl">{fact.value}</p>
                <p className="text-xs leading-5 text-muted-foreground sm:mx-auto sm:mt-2 sm:max-w-[15rem]">{fact.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="our-story" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-20">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-blue-vivid">02 / Why we exist</p>
              <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">Too much good work gets lost between the idea and the operating system.</h2>
            </Reveal>
            <Reveal delay={0.08} className="space-y-8">
              <p className="text-balance font-display text-2xl leading-snug text-navy sm:text-4xl">Traditional software delivery often asks clients to speak like engineers and engineers to guess the business.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <StoryCard number="A" title="The gap" text="A real problem can be commercially important and still be difficult to translate into a buildable, fairly priced plan." />
                <StoryCard number="B" title="Our response" text="Put structure around the conversation, connect the right people, and make delivery understandable from both sides." />
              </div>
              <p className="text-base leading-8 text-muted-foreground">Somahorse is the connective layer: a clearer way for clients, talent, and platform operators to move from uncertainty to an accountable project—and then keep the finished system useful.</p>
            </Reveal>
          </div>
        </section>

        <section className="bg-white/62 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-3xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-blue-vivid">03 / Our approach</p>
              <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">A calmer path from problem to production.</h2>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OPERATING_STEPS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.number} delay={index * 0.06} className="h-full">
                    <article className="group flex h-full min-h-64 flex-col rounded-[1.75rem] border border-border/80 bg-white/82 p-6 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-vivid/20 hover:shadow-card">
                      <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-blue-mist text-blue-vivid"><Icon className="size-5" aria-hidden /></span><span className="font-mono text-xs font-bold text-navy/25">{item.number}</span></div>
                      <h3 className="mt-auto pt-10 font-display text-2xl font-bold text-navy">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-3xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-blue-vivid">04 / Principles</p>
              <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">The standards behind the platform.</h2>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <Reveal key={principle.title} delay={index * 0.05} className={principle.className}>
                    <article className="group relative h-full overflow-hidden rounded-[1.75rem] border border-border/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl sm:p-8">
                      <span className="absolute -right-12 -top-12 size-36 rounded-full bg-blue-vivid/[0.06] transition duration-500 group-hover:scale-125" aria-hidden />
                      <span className="relative grid size-11 place-items-center rounded-2xl bg-navy text-blue-sky"><Icon className="size-5" aria-hidden /></span>
                      <h3 className="relative mt-8 font-display text-2xl font-bold text-navy">{principle.title}</h3>
                      <p className="relative mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{principle.text}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-navy px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
          <div className="about-console-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-vivid/30 blur-[120px]" aria-hidden />
          <div className="relative mx-auto max-w-7xl">
            <Reveal className="grid items-end gap-6 lg:grid-cols-[1fr_0.48fr]">
              <div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">05 / Meet the team</p><h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">Small enough to care. Built to coordinate big work.</h2></div>
              <p className="text-sm leading-7 text-white/58 sm:text-base">Five people connecting product judgement, engineering, talent, and client delivery around one mission.</p>
            </Reveal>

            <div className="mt-12 grid gap-4 lg:grid-cols-[0.84fr_1.16fr]">
              <Reveal className="h-full"><FounderCard member={TEAM[0]} /></Reveal>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {TEAM.slice(1).map((member, index) => <Reveal key={member.role} delay={index * 0.05}><TeamCard member={member} /></Reveal>)}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-vivid to-navy px-6 py-12 text-center text-white shadow-2xl sm:px-12 sm:py-16">
            <div className="about-console-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-balance font-display text-3xl font-bold sm:text-5xl">Bring the problem. We&apos;ll help create the path forward.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">Start a project as a client or join the certified talent network building the next generation of African systems.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={clientHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-navy transition hover:bg-blue-mist">Start a project <ArrowRight className="size-4" aria-hidden /></Link>
                <Link href={talentHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-6 text-sm font-bold text-white transition hover:bg-white/[0.14]">Join as talent</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SystemNode({ label, detail, icon: Icon, className = "" }: { label: string; detail: string; icon: typeof MessageCircle; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-md ${className}`}><Icon className="size-4 text-blue-sky" aria-hidden /><p className="mt-4 text-xs font-bold text-white">{label}</p><p className="mt-1 text-[9px] text-white/38">{detail}</p></div>;
}

function StoryCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="rounded-[1.5rem] border border-border/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl"><span className="font-mono text-xs font-bold text-blue-vivid">{number}</span><h3 className="mt-8 font-display text-2xl font-bold text-navy">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p></article>;
}

function FounderCard({ member }: { member: (typeof TEAM)[number] }) {
  return (
    <article className="relative flex h-full min-h-[25rem] flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 backdrop-blur-xl sm:p-8">
      <div className={`absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br ${member.accent} opacity-20 blur-3xl`} aria-hidden />
      <div className="relative flex items-start justify-between gap-4"><span className={`grid size-24 place-items-center rounded-[1.75rem] bg-gradient-to-br text-2xl font-bold text-white shadow-2xl ${member.accent}`}>{member.initials}</span><span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">Co-founder</span></div>
      <div className="relative mt-auto pt-14"><h3 className="font-display text-3xl font-bold text-white">{member.name}</h3><p className="mt-2 text-sm font-bold text-blue-300">{member.role}</p><p className="mt-5 max-w-md text-sm leading-7 text-white/55">Guiding the Somahorse vision, company strategy, and the system that brings clients, talent, and accountable delivery together.</p></div>
    </article>
  );
}

function TeamCard({ member }: { member: (typeof TEAM)[number] }) {
  return (
    <article className="group flex min-h-48 flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.09] sm:min-h-56 sm:p-6">
      <span className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-xl sm:size-16 ${member.accent}`}>{member.initials}</span>
      <div className="mt-auto pt-8"><h3 className="font-display text-base font-bold text-white sm:text-xl">{member.name}</h3><p className="mt-1.5 text-[10px] font-bold uppercase leading-4 tracking-[0.11em] text-blue-300 sm:text-[11px]">{member.role}</p></div>
    </article>
  );
}
