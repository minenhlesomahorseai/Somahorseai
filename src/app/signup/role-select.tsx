import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Code2 } from "lucide-react";

const ROLES = [
  {
    href: "/signup?role=client",
    eyebrow: "I'm a",
    title: "Client",
    body: "Describe your agricultural problem in plain language. Our AI scopes it, prices it, and a certified team builds it.",
    icon: Building2,
    header: "bg-gradient-to-br from-client to-client-bright",
    ring: "border-client/30 hover:border-client hover:shadow-[0_24px_60px_-30px_hsl(160_84%_30%/0.55)]",
    cta: "bg-client hover:bg-emerald-900",
    chip: "bg-client-tint text-client",
  },
  {
    href: "/signup?role=developer",
    eyebrow: "I'm a",
    title: "Developer",
    body: "Join a vetted network of African engineers. Get matched with funded projects and earn milestone-based payouts.",
    icon: Code2,
    header: "bg-gradient-to-br from-talent to-talent-bright",
    ring: "border-talent/30 hover:border-talent hover:shadow-[0_24px_60px_-30px_hsl(224_82%_56%/0.55)]",
    cta: "bg-talent hover:bg-navy",
    chip: "bg-talent-tint text-talent",
  },
] as const;

export function RoleSelect() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background hero-field dotted-grid">
      <div className="pointer-events-none absolute -top-40 left-1/4 size-[520px] rounded-full bg-client-bright/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-[520px] rounded-full bg-talent/10 blur-[140px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={34}
            height={34}
            className="size-8 rounded-full object-contain"
            priority
          />
          <span className="font-display text-base font-bold text-navy">
            Somahorse<span className="text-blue-vivid">.ai</span>
          </span>
        </Link>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-navy-mid shadow-soft backdrop-blur-md transition hover:bg-white font-ui"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to site
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <span className="cue text-navy-mid">Create your account</span>
        <h1 className="mt-3 text-center font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Welcome to <span className="text-gradient">Somahorse.ai</span>
        </h1>
        <p className="mt-3 max-w-md text-center text-sm italic text-muted-foreground sm:text-base">
          First things first — which side of the platform are you on?
        </p>

        <div className="mt-10 grid w-full max-w-2xl gap-5 sm:grid-cols-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.title}
                href={role.href}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 ${role.ring}`}
              >
                <span className={`flex items-center justify-between px-6 py-5 text-white ${role.header}`}>
                  <span className="grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-right">
                    <span className="block text-[11px] font-semibold uppercase tracking-widest text-white/75 font-ui">{role.eyebrow}</span>
                    <span className="block font-display text-2xl font-bold leading-tight">{role.title}</span>
                  </span>
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    {role.body}
                  </p>
                  <span className={`mt-6 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold text-white transition font-ui ${role.cta}`}>
                    Continue
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-muted-foreground font-ui">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-blue-vivid hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
