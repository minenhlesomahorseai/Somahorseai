import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Code2,
  Coins,
  Cpu,
  FolderKanban,
  GitPullRequest,
  LockKeyhole,
  MessageCircle,
  MessageSquareCode,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { FloatingNav } from "@/components/home/floating-nav";
import { Footer } from "@/components/home/footer";
import { Reveal } from "@/components/home/reveal";
import { getMarketingUser } from "@/lib/auth/marketing";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency/config";
import { getVisitorCurrencyContext } from "@/lib/currency/context";
import { tryQuoteFx } from "@/lib/currency/fx";
import { DeveloperFAQ } from "./developer-faq";

export const metadata: Metadata = {
  title: "For Developers — Somahorse.ai",
  description:
    "Join the certified Somahorse developer network, work on funded digital infrastructure projects, and track delivery and earnings in one shared workspace.",
};

const STACK = ["TypeScript", "Next.js", "React", "Node.js", "Python", "PostgreSQL", "AI APIs", "Cloud infrastructure"];

const EXPERIENCE = [
  {
    icon: Sparkles,
    title: "AI-scoped before you start",
    description: "Every accepted brief becomes a structured delivery plan with milestones, tasks, owners, and a clear definition of done.",
    className: "lg:col-span-2",
  },
  {
    icon: FolderKanban,
    title: "One delivery workspace",
    description: "See the current milestone, shared team tasks, expected finish date, and project progress without stitching tools together.",
    className: "",
  },
  {
    icon: MessageCircle,
    title: "Context stays with the project",
    description: "Realtime, participant-only messaging keeps the client, talent team, and Somahorse control room aligned.",
    className: "",
  },
  {
    icon: CircleDollarSign,
    title: "Transparent earnings",
    description: "Verified client payments allocate 60% to the project talent pool, with owed and paid amounts visible in your ledger.",
    className: "lg:col-span-2",
  },
] as const;

const PIPELINE = [
  {
    step: "01",
    icon: UserPlus,
    title: "Build your profile",
    description: "Tell us your role, strongest skills, experience, availability, and the kind of systems you build best.",
  },
  {
    step: "02",
    icon: ClipboardCheck,
    title: "Complete the assessment",
    description: "Work through a practical technical assessment designed to reveal how you reason, model, and deliver.",
  },
  {
    step: "03",
    icon: MessageSquareCode,
    title: "Review and certification",
    description: "The Somahorse team reviews your submission and interview before approving you for the certified network.",
  },
  {
    step: "04",
    icon: PartyPopper,
    title: "Match, build, earn",
    description: "Accept relevant invitations, collaborate in a shared workspace, and follow every allocation through your earnings ledger.",
  },
] as const;

const STANDARDS = [
  { icon: Code2, title: "Engineering clarity", text: "Readable code, sound data models, careful tradeoffs, and maintainable architecture." },
  { icon: GitPullRequest, title: "Delivery discipline", text: "Small verifiable increments, useful updates, and ownership through completion." },
  { icon: ShieldCheck, title: "Production judgement", text: "Security, resilience, accessibility, and real-world operating constraints." },
] as const;

export default async function DevelopersPage() {
  const [user, visitor] = await Promise.all([
    getMarketingUser(),
    getVisitorCurrencyContext(),
  ]);
  const requestedCurrency = user?.preferredCurrency ?? visitor.currency;
  const fx = await tryQuoteFx(1, BASE_CURRENCY, requestedCurrency);
  const currency = fx ? requestedCurrency : BASE_CURRENCY;
  const localMoney = (amountZar: number) =>
    formatMoney(amountZar * (fx?.rate ?? 1), currency, {
      maximumFractionDigits: 0,
    });
  const applyHref = user?.dashboardPath ?? "/signup?role=developer";
  const applyLabel = user
    ? user.role === "client"
      ? "Go to dashboard"
      : "Open talent dashboard"
    : "Apply to the network";

  return (
    <>
      <FloatingNav user={user} />

      <main className="developer-page relative min-h-screen overflow-hidden">
        <div className="developer-code-grid pointer-events-none absolute inset-x-0 top-0 h-[58rem] opacity-70" aria-hidden />

        <section className="developer-hero-mesh relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-36">
          <div className="pointer-events-none absolute left-[8%] top-28 size-56 rounded-full bg-blue-vivid/10 blur-[90px]" />
          <div className="pointer-events-none absolute right-[4%] top-20 size-72 rounded-full bg-talent-bright/10 blur-[110px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(31rem,1.1fr)] lg:gap-10">
            <Reveal className="min-w-0">
              <h1 className="max-w-3xl text-balance font-display text-[clamp(2.8rem,7vw,5.8rem)] font-bold leading-[0.96] tracking-[-0.055em] text-navy">
                Build systems that move <span className="text-dev-gradient">real economies.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Join a vetted engineering network for serious, funded work. Get a clear scope, a shared delivery workspace, direct project communication, and transparent earnings.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={applyHref} className="dev-hero-btn-primary">
                  {applyLabel} <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="#how-it-works" className="dev-hero-btn-secondary">
                  See how it works
                </Link>
              </div>
              <div className="mt-8 grid max-w-lg grid-cols-3 divide-x divide-border/80 border-y border-border/70 py-4">
                <HeroProof value="60%" label="Talent pool" />
                <HeroProof value="Live" label="Project chat" />
                <HeroProof value="Clear" label="Milestones" />
              </div>
            </Reveal>

            <Reveal delay={0.12} className="relative hidden min-w-0 lg:block">
              <DeveloperWorkspacePreview earningAmount={localMoney(18_000)} />
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border/65 bg-white/72 py-5 backdrop-blur-xl">
          <div className="developer-marquee-mask mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 sm:justify-center sm:px-6">
            <span className="mr-2 shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Built across</span>
            {STACK.map((item) => <span key={item} className="shrink-0 rounded-full border border-border/80 bg-white px-3 py-1.5 text-[11px] font-bold text-navy-mid shadow-soft">{item}</span>)}
          </div>
        </section>

        <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-3xl">
              <p className="cue text-blue-vivid">The developer experience</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">Less platform noise. More meaningful delivery.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Somahorse connects the commercial brief, the people doing the work, the client conversation, and the money behind it.</p>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EXPERIENCE.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={Math.min(index * 0.05, 0.18)} className={item.className}>
                    <article className="developer-panel group relative h-full min-h-64 overflow-hidden rounded-[2rem] p-6 sm:p-7">
                      <span className="absolute -right-10 -top-12 size-36 rounded-full bg-blue-vivid/6 transition duration-500 group-hover:scale-125" />
                      <div className="relative flex h-full flex-col">
                        <span className="grid size-11 place-items-center rounded-2xl bg-blue-vivid/10 text-blue-vivid"><Icon className="size-5" aria-hidden /></span>
                        <h3 className="mt-auto pt-14 font-display text-xl font-bold text-navy sm:text-2xl">{item.title}</h3>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <Reveal className="developer-dark-panel relative mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] px-5 py-8 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div className="pointer-events-none absolute -right-24 -top-32 size-[28rem] rounded-full border border-white/8 bg-blue-vivid/12" />
            <div className="relative grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-sky">Built for focus</p>
                <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">One project. One source of truth.</h2>
                <p className="mt-4 text-sm leading-7 text-white/58">You always know what is being built, who owns the next task, what the client has seen, and what the project has earned.</p>
                <Link href={applyHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-navy transition hover:bg-blue-mist">{applyLabel} <ArrowUpRight className="size-4" aria-hidden /></Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DarkFeature icon={CheckCircle2} title="Milestones move progress" text="Completing shared tasks updates the client-facing project progress automatically." />
                <DarkFeature icon={MessageCircle} title="Replies arrive instantly" text="Project messages, unread state, and read receipts update without a refresh." />
                <DarkFeature icon={WalletCards} title="Every allocation is visible" text="See the payment, the 60% talent pool, your share, and payout status." />
                <DarkFeature icon={UsersRound} title="Teams share the context" text="Clients, assigned talent, and the control room collaborate in one secure space." />
              </div>
            </div>
          </Reveal>
        </section>

        <section id="how-it-works" className="relative border-y border-border/65 bg-white/58 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal className="text-center">
              <p className="cue text-blue-vivid">Certification path</p>
              <h2 className="mx-auto mt-3 max-w-3xl text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">A high-trust network starts with a real signal.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">The process is designed to understand how you think and what you can own—not how polished your résumé sounds.</p>
            </Reveal>

            <div className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="developer-step-line pointer-events-none absolute left-[10%] right-[10%] top-8 hidden h-px lg:block" aria-hidden />
              {PIPELINE.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.step} delay={index * 0.06}>
                    <article className="developer-panel relative h-full rounded-[1.75rem] p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <span className="relative z-10 grid size-12 place-items-center rounded-2xl bg-navy text-white shadow-glow"><Icon className="size-5" aria-hidden /></span>
                        <span className="font-display text-3xl font-bold text-blue-vivid/14">{item.step}</span>
                      </div>
                      <h3 className="mt-7 font-display text-lg font-bold text-navy">{item.title}</h3>
                      <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <Reveal>
              <p className="cue text-blue-vivid">What earns certification</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">Strong signals, not buzzwords.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">We look for engineers who can turn a real operating problem into software people can trust.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["Frontend", "Backend", "Mobile", "Data", "AI engineering", "DevOps", "Product design"].map((role) => <span key={role} className="rounded-full border border-blue-vivid/12 bg-blue-vivid/6 px-3 py-1.5 text-[11px] font-bold text-navy-mid">{role}</span>)}
              </div>
            </Reveal>
            <div className="grid gap-3">
              {STANDARDS.map((standard, index) => {
                const Icon = standard.icon;
                return (
                  <Reveal key={standard.title} delay={index * 0.05}>
                    <div className="developer-panel flex items-start gap-4 rounded-[1.5rem] p-5 sm:p-6">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-vivid/10 text-blue-vivid"><Icon className="size-5" aria-hidden /></span>
                      <div><h3 className="font-display text-lg font-bold text-navy">{standard.title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{standard.text}</p></div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <Reveal className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-blue-vivid/12 bg-white shadow-elevated lg:grid-cols-[1fr_0.8fr]">
            <div className="p-6 sm:p-10 lg:p-12">
              <p className="cue text-blue-vivid">A transparent commercial model</p>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">Know what the project paid and what is owed to talent.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">After each verified client payment, the platform records a 60% talent-pool allocation. Your dashboard separates what is owed from what has actually been paid out.</p>
              <div className="mt-7 flex items-center gap-3 rounded-2xl bg-blue-light/55 p-4 text-xs leading-5 text-navy-mid"><LockKeyhole className="size-5 shrink-0 text-blue-vivid" aria-hidden /> Payment records and project communication stay visible only to authorized participants.</div>
            </div>
            <div className="bg-gradient-to-br from-navy to-navy-mid p-6 text-white sm:p-10 lg:p-12">
              <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Example verified payment</span><Coins className="size-5 text-blue-sky" aria-hidden /></div>
              <p className="mt-4 font-display text-4xl font-bold">{localMoney(100_000)}</p>
              <div className="mt-7 space-y-3">
                <PaymentLine label="Talent pool · 60%" value={localMoney(60_000)} strong />
                <PaymentLine label="Platform delivery share · 40%" value={localMoney(40_000)} />
              </div>
              <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs font-bold text-white/80">For multi-person teams</p><p className="mt-1 text-[11px] leading-5 text-white/48">The talent pool is divided across assigned team members and tracked per person in the earnings ledger.</p></div>
            </div>
          </Reveal>
        </section>

        <section id="dev-faq" className="border-t border-border/65 bg-white/52 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <p className="cue text-blue-vivid">Good questions</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy sm:text-5xl">Before you apply</h2>
            </Reveal>
            <Reveal delay={0.08} className="mt-12"><DeveloperFAQ /></Reveal>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Reveal className="developer-cta relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-vivid/35 blur-[100px]" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-sky"><Cpu className="size-3.5" aria-hidden /> For serious builders</span>
              <h2 className="mx-auto mt-5 max-w-3xl text-balance font-display text-3xl font-bold tracking-tight sm:text-5xl">Your next project should be worth the effort.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">Bring your judgement, craft, and ownership. Somahorse brings the scope, workspace, project context, and transparent commercial record.</p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={applyHref} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-navy shadow-glow transition hover:bg-blue-mist sm:w-auto">{applyLabel} <ArrowUpRight className="size-4" aria-hidden /></Link>
                <Link href="/" className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/7 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/12 sm:w-auto">Explore Somahorse</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}

function DeveloperWorkspacePreview({
  earningAmount,
}: {
  earningAmount: string;
}) {
  return (
    <div className="relative mx-auto max-w-2xl lg:ml-auto">
      <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-vivid/16 to-talent-bright/10 blur-3xl" />
      <div className="developer-console relative overflow-hidden rounded-[2rem] border border-white/15 p-3 shadow-[0_40px_100px_-45px_rgba(4,18,54,.9)] sm:p-4">
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-sky" /><span className="size-2.5 rounded-full bg-blue-vivid" /><span className="size-2.5 rounded-full bg-talent-bright" /></div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/7 px-3 py-1 text-[9px] font-bold text-white/58"><LockKeyhole className="size-3" aria-hidden /> Private workspace</span>
        </div>

        <div className="grid gap-3 pt-3 sm:grid-cols-[1fr_0.72fr]">
          <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-sky">Active project</p><h2 className="mt-1.5 font-display text-lg font-bold text-white">Cold-chain visibility</h2><p className="mt-1 text-[10px] text-white/42">Shared delivery plan</p></div><span className="rounded-full bg-blue-vivid/20 px-2.5 py-1 text-[9px] font-bold text-blue-sky">In build</span></div>
            <div className="mt-5 flex items-end justify-between"><div><p className="font-display text-3xl font-bold text-white">64%</p><p className="mt-0.5 text-[9px] text-white/38">8 of 12 tasks complete</p></div><span className="grid size-10 place-items-center rounded-2xl bg-blue-vivid/15 text-blue-sky"><Check className="size-4" aria-hidden /></span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[64%] rounded-full bg-gradient-to-r from-blue-vivid to-talent-bright" /></div>
            <div className="mt-5 space-y-2">
              <PreviewTask label="Map temperature events" done />
              <PreviewTask label="Add exception alerts" done />
              <PreviewTask label="Validate offline sync" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/42">Project chat</p><span className="size-2 rounded-full bg-blue-sky shadow-[0_0_12px_rgba(125,211,252,.8)]" /></div>
              <div className="mt-4 rounded-2xl rounded-bl-md bg-white/10 p-3"><p className="text-[9px] font-bold text-blue-sky">Lerato · Client</p><p className="mt-1 text-[10px] leading-4 text-white/70">The warehouse team approved the alert flow.</p></div>
              <div className="ml-5 mt-2 rounded-2xl rounded-br-md bg-blue-vivid p-3"><p className="text-[10px] leading-4 text-white">Great — I&apos;ll finish offline validation next.</p><p className="mt-1 text-right text-[8px] text-white/55">Read ✓✓</p></div>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-blue-vivid/30 to-talent-bright/18 p-4">
              <div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">Your earnings</span><CircleDollarSign className="size-4 text-blue-sky" aria-hidden /></div>
              <p className="mt-2 font-display text-2xl font-bold text-white">{earningAmount}</p>
              <div className="mt-3 flex items-center justify-between text-[9px]"><span className="text-white/42">From verified payment</span><span className="rounded-full bg-white/10 px-2 py-1 font-bold text-blue-sky">Owed</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-blue-vivid/10 bg-white/90 px-4 py-3 shadow-elevated backdrop-blur-xl sm:flex"><span className="grid size-9 place-items-center rounded-xl bg-blue-vivid/10 text-blue-vivid"><MessageCircle className="size-4" aria-hidden /></span><div><p className="text-[10px] font-bold text-navy">New client message</p><p className="mt-0.5 text-[9px] text-muted-foreground">Just now · no refresh</p></div></div>
    </div>
  );
}

function PreviewTask({ label, done = false }: { label: string; done?: boolean }) {
  return <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5"><span className={`grid size-5 shrink-0 place-items-center rounded-full ${done ? "bg-blue-vivid text-white" : "border border-white/15 text-white/25"}`}>{done ? <Check className="size-3" aria-hidden /> : <Clock3 className="size-3" aria-hidden />}</span><span className={`truncate text-[10px] ${done ? "text-white/42 line-through" : "font-bold text-white/72"}`}>{label}</span></div>;
}

function HeroProof({ value, label }: { value: string; label: string }) {
  return <div className="px-3 first:pl-0"><p className="font-display text-xl font-bold text-navy sm:text-2xl">{value}</p><p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">{label}</p></div>;
}

function DarkFeature({ icon: Icon, title, text }: { icon: typeof CheckCircle2; title: string; text: string }) {
  return <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl"><span className="grid size-9 place-items-center rounded-xl bg-blue-vivid/18 text-blue-sky"><Icon className="size-4" aria-hidden /></span><h3 className="mt-5 font-display text-base font-bold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-white/48">{text}</p></div>;
}

function PaymentLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ${strong ? "bg-blue-vivid/25" : "bg-white/6"}`}><span className={`text-xs ${strong ? "font-bold text-blue-sky" : "text-white/48"}`}>{label}</span><span className="font-display text-base font-bold text-white">{value}</span></div>;
}
