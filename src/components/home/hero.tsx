"use client";
 
import {
  ArrowRight,
  ArrowUpRight,
  Loader2,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { MarketingUser } from "@/lib/auth/marketing";
 
const EASE = [0.16, 1, 0.3, 1] as const;
const SHOW_DEV_LOGOUT = process.env.NODE_ENV === "development";
 
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
    <section
      aria-label="Hero"
      className="relative w-full min-h-[100svh] flex flex-col items-center justify-center px-4 md:px-8 lg:px-16 overflow-hidden"
    >
      {/* ── Full-bleed background image ── */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          alt="African agricultural landscape at golden hour"
          src="/hero-bg.png"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Subtle overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/70" />
      </div>

      {/* ── Dev logout (development only) ── */}
      {SHOW_DEV_LOGOUT && (
        <div className="absolute top-20 right-4 z-20">
          <button
            type="button"
            onClick={handleDevLogout}
            disabled={isLoggingOut}
            title={
              logoutFailed
                ? "Logout failed. Check Supabase env vars and try again."
                : "Development logout"
            }
            className="flex items-center gap-2 rounded-full border border-accent-amber/25 bg-white/80 px-4 py-2 text-xs font-semibold text-navy shadow-soft backdrop-blur transition hover:bg-accent-amber/10 disabled:cursor-not-allowed disabled:opacity-70"
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

      {/* ── Hero content ── */}
      <div className="relative z-10 text-center max-w-5xl mx-auto pt-16">
        <motion.h1
          className="h-hero px-2 sm:px-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <span className="block sm:whitespace-nowrap">
            AI Infrastructure
          </span>
          <span className="block sm:whitespace-nowrap">
            for{" "}
            <span className="text-handwritten text-[1.15em]">
              African agriculture
            </span>
          </span>
        </motion.h1>

        <motion.p
          className="lead mt-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
        >
          Describe your problem in plain language. Watch our AI scope it, price it,
          assemble a certified team, manage the build, and keep it running.
        </motion.p>
      </div>

      {/* ── Showcase card / product preview ── */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mt-8 mb-8 px-2 sm:px-0"
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
      >
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/80 shadow-2xl shadow-navy/10">
          {/* Product screenshot / showcase image */}
          <div className="w-full aspect-video relative bg-gradient-to-br from-blue-mist to-blue-light">
            <Image
              alt="Somahorse.ai platform preview"
              src="/agriculture-banner.jpg"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>

          {/* Inner ring effect */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none ring-1 ring-inset ring-black/5" />

          {/* CTA button overlaid on bottom-right */}
          <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-20">
            <Link
              href={primaryCta.href}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-7 sm:py-3.5 bg-blue-vivid text-white rounded-full font-medium hover:bg-navy-mid transition-all text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-vivid/30 border border-blue-vivid/40"
            >
              {primaryCta.label}{" "}
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
