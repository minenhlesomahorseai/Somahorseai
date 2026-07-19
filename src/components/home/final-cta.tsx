import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./reveal";
import type { MarketingUser } from "@/lib/auth/marketing";

function ctaPair(user: MarketingUser | null) {
  if (user?.role === "client") {
    return {
      primary: { href: user.startProjectPath ?? user.dashboardPath, label: "Start a project" },
      secondary: { href: user.dashboardPath, label: "Go to dashboard" },
    };
  }
  if (user?.role === "talent") {
    return {
      primary: { href: user.dashboardPath, label: "Go to your dashboard" },
      secondary: { href: "/developers", label: "For developers" },
    };
  }
  return {
    primary: { href: "/signup?role=client", label: "Start a project" },
    secondary: { href: "/developers", label: "Join as a developer" },
  };
}

export function FinalCTA({ user = null }: { user?: MarketingUser | null }) {
  const { primary, secondary } = ctaPair(user);
  return (
    <section id="start" className="relative overflow-hidden px-4 sm:px-8 lg:px-12 pb-24 pt-8">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[34px] border border-border bg-gradient-to-b from-blue-mist via-white to-white px-6 py-16 text-center shadow-card sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 size-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-vivid/8 blur-[120px]" />
        <div className="relative">
          <p className="text-xs font-semibold text-blue-vivid uppercase tracking-[0.2em] mb-4">
            Start with one agricultural problem
          </p>
          <h2 className="h-section mx-auto max-w-3xl text-balance">
            Describe it once. Let the system scope, staff, build, and monitor it.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            The first project becomes the proof. The monitoring loop becomes the recurring engine.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primary.href}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy"
            >
              {primary.label}
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
            <Link
              href={secondary.href}
              className="flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-7 text-sm font-semibold text-navy backdrop-blur-md transition hover:bg-blue-mist hover:border-navy-mid/20"
            >
              {secondary.label}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
