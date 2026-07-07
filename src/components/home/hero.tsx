"use client";
 
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  Leaf,
  Loader2,
  LogOut,
  Network,
  Play,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import type { MarketingUser } from "@/lib/auth/marketing";
 
const EASE = [0.16, 1, 0.3, 1] as const;
const SHOW_DEV_LOGOUT = process.env.NODE_ENV === "development";
 
type NodeItem = {
  label: string;
  value: string;
  position: string;
  icon: LucideIcon;
  tone: string;
};
 
const NODES: NodeItem[] = [
  { label: "Yield model", value: "+18.4%", position: "left-[3%] top-[26%]", icon: Leaf, tone: "text-accent-teal bg-accent-teal/10 ring-accent-teal/25" },
  { label: "Supply chain", value: "live", position: "right-[4%] top-[22%]", icon: Network, tone: "text-navy-mid bg-navy-mid/10 ring-navy-mid/20" },
  { label: "Drift watch", value: "0 alerts", position: "left-[5%] bottom-[24%]", icon: Activity, tone: "text-accent-amber bg-accent-amber/10 ring-accent-amber/25" },
  { label: "Dev network", value: "900", position: "right-[4%] bottom-[27%]", icon: UsersRound, tone: "text-blue-vivid bg-blue-vivid/10 ring-blue-vivid/25" },
];
 
function FloatingNode({ item, index }: { item: NodeItem; index: number }) {
  const Icon = item.icon;
  const iconColor = item.tone.split(" ")[0];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.12, duration: 0.55, ease: EASE }}
      className={`absolute ${item.position} hidden animate-float xl:flex`}
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-white/85 px-3.5 py-2.5 shadow-card backdrop-blur-md">
        <span className={`grid size-8 place-items-center rounded-xl ring-1 ${item.tone}`}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-semibold text-navy font-ui">{item.label}</span>
          <span className={`block font-display text-[11px] font-semibold ${iconColor}`}>{item.value}</span>
        </span>
      </div>
    </motion.div>
  );
}
 
function SystemMap() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-60">
      <span className="system-map-line left-0 top-[30%] w-[26%]" />
      <span className="system-map-line right-0 top-[31%] w-[25%]" />
      <span className="system-map-line left-0 bottom-[28%] w-[27%]" />
      <span className="system-map-line right-0 bottom-[31%] w-[28%]" />
      <span className="absolute left-[23%] top-[28%] size-28 rounded-full border border-navy-mid/10" />
      <span className="absolute right-[19%] top-[25%] size-32 rounded-full border border-blue-vivid/12" />
      <span className="absolute left-[20%] bottom-[24%] size-36 rounded-full border border-blue-vivid/10" />
      <span className="absolute right-[17%] bottom-[24%] size-28 rounded-full border border-navy-mid/12" />
    </div>
  );
}
 
export function Hero({ user = null }: { user?: MarketingUser | null }) {
  const router = useRouter();
  const primaryCta =
    user?.role === "talent"
      ? { href: user.dashboardPath, label: "Go to your dashboard" }
      : user?.startProjectPath
        ? { href: user.startProjectPath, label: "Start a project" }
        : { href: "#start", label: "Start a project" };
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  const handleDevLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutFailed(false);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login");
    } catch {
      setLogoutFailed(true);
      setIsLoggingOut(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden px-2 pb-20 pt-3 sm:px-3">
      <div className="hero-field absolute inset-x-2 bottom-4 top-2 -z-10 overflow-hidden rounded-[26px] border border-border shadow-calm sm:inset-x-3 md:rounded-[36px]">
        <div className="dotted-grid absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-[30%] size-[78vw] max-h-[760px] max-w-[1020px] -translate-x-1/2 rounded-full bg-blue-vivid/10 blur-[130px] animate-glow-pulse" />
        <SystemMap />
      </div>
 
      {NODES.map((item, i) => (
        <FloatingNode key={item.label} item={item} index={i} />
      ))}
 
      <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-4xl flex-col items-center justify-center px-4 pt-28 pb-16 text-center sm:pt-32">
        {SHOW_DEV_LOGOUT && (
          <div className="mb-4 flex w-full justify-center sm:justify-end">
            <button
              type="button"
              onClick={handleDevLogout}
              disabled={isLoggingOut}
              title={
                logoutFailed
                  ? "Logout failed. Check Supabase env vars and try again."
                  : "Development logout"
              }
              className="flex min-h-10 items-center justify-center gap-2 rounded-full border border-accent-amber/25 bg-white/80 px-4 text-xs font-semibold text-navy shadow-soft backdrop-blur transition hover:bg-accent-amber/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggingOut ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <LogOut className="size-3.5" aria-hidden />
              )}
              {logoutFailed ? "Retry logout" : isLoggingOut ? "Logging out" : "Dev logout"}
            </button>
          </div>
        )}

        <Link
          href="#platform"
          className="mb-7 flex items-center gap-2 rounded-full border border-navy-mid/15 bg-white/70 px-4 py-1.5 text-xs font-semibold text-navy-mid backdrop-blur animate-fade-up hover:bg-blue-light font-ui"
        >
          <span className="size-2 rounded-full bg-blue-vivid animate-glow-pulse" />
          Now focused on African agriculture
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
 
        <h1 className="h-hero max-w-4xl text-balance animate-fade-up" style={{ animationDelay: "0.05s" }}>
          The AI that <span className="text-gradient">builds</span>{" "}
          Africa&apos;s agricultural systems.
        </h1>
 
        <p className="lead mt-6 max-w-2xl animate-fade-up" style={{ animationDelay: "0.12s" }}>
          Describe your problem in plain language. Watch our AI scope it, price it, assemble a
          certified team, manage the build, and keep it running — in minutes, not weeks.
        </p>
 
        <div
          className="mt-9 flex w-full max-w-sm flex-col items-stretch gap-3 animate-fade-up sm:w-auto sm:flex-row sm:items-center"
          style={{ animationDelay: "0.18s" }}
        >
          <Link
            href={primaryCta.href}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-navy-mid px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-navy font-ui"
          >
            {primaryCta.label} <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="#how-it-works"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-border-strong bg-white/80 px-7 text-sm font-semibold text-navy transition hover:border-navy-mid/25 hover:bg-blue-mist font-ui"
          >
            <Play className="size-4 fill-current" aria-hidden /> See how it works
          </Link>
        </div>
 
        <div
          className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-3 animate-fade-up sm:grid-cols-3"
          style={{ animationDelay: "0.24s" }}
        >
          {(
            [
              ["Scope", "plain-language intake", "bg-accent-teal/12 text-accent-teal"],
              ["Build", "certified delivery team", "bg-navy-mid/12 text-navy-mid"],
              ["Monitor", "drift & health watch", "bg-accent-amber/15 text-accent-amber"],
            ] as const
          ).map(([title, detail, tone]) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-white/75 px-5 py-4 text-left shadow-soft backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-display text-xs font-bold ${tone}`}>
                {title}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>
 
      <div className="absolute inset-x-0 bottom-8 z-10 mx-auto hidden max-w-6xl items-end justify-between px-8 md:flex">
        <div className="cue flex items-center gap-2 text-muted-foreground">
          <span className="grid size-8 place-items-center rounded-full border border-border bg-white/80 shadow-soft">
            <ArrowDown className="size-3.5" aria-hidden />
          </span>
          02 / 03 · Scroll to explore
        </div>
        <div className="flex items-center gap-3">
          <span className="cue text-muted-foreground">Agri horizons</span>
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-7 rounded-full bg-navy-mid" />
            <span className="h-1.5 w-3 rounded-full bg-navy-mid/20" />
            <span className="h-1.5 w-3 rounded-full bg-navy-mid/20" />
            <span className="h-1.5 w-3 rounded-full bg-navy-mid/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
