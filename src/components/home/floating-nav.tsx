"use client";

import { ArrowUpRight, LayoutDashboard, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { MarketingUser } from "@/lib/auth/marketing";

const EASE = [0.16, 1, 0.3, 1] as const;

const NAV = [
  { href: "/", label: "Platform" },
  { href: "/agriculture", label: "Agriculture" },
  { href: "/developers", label: "For Developers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
];

export function FloatingNav({ user = null }: { user?: MarketingUser | null }) {
  const pathname = usePathname();
  const isDevPage = pathname === "/developers";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dashboardLabel = user?.role === "client" ? "Go to dashboard" : "Visit dashboard";

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <nav
        aria-label="Primary"
        className={[
          "mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-full border px-3 py-2 transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-border bg-white/85 shadow-nav backdrop-blur-xl"
            : "border-border/60 bg-white/65 shadow-soft backdrop-blur-md",
        ].join(" ")}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2 pl-1">
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={34}
            height={34}
            className="size-8 rounded-full object-contain"
            priority
          />
          <span className="font-display text-[15px] font-bold tracking-tight text-navy">
            Somahorse<span className="text-blue-vivid">.ai</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1.5 lg:flex">
          {NAV.map((item) => (
            <li key={item.href} className="px-1">
              <Link
                href={item.href}
                className="relative py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-navy group font-ui"
              >
                {item.label}
                <span className={`absolute left-0 -bottom-0.5 h-[2px] w-full rounded-full bg-blue-vivid transition-all duration-300 origin-center ${
                  pathname === item.href
                    ? "scale-x-100 opacity-100"
                    : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                }`} />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="#protection"
              className="ml-1 flex items-center gap-1.5 rounded-full bg-blue-light px-3 py-1.5 text-sm font-semibold text-navy-mid ring-1 ring-navy-mid/15 transition hover:bg-blue-vivid/15 font-ui"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Protection
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </li>
        </ul>

        {user ? (
          <div className="hidden items-center gap-2 lg:flex">
            {user.startProjectPath ? (
              <Link
                href={user.startProjectPath}
                className="rounded-full bg-navy-mid px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-navy font-ui"
              >
                Start a project
              </Link>
            ) : (
              <Link
                href={user.dashboardPath}
                className="flex items-center gap-1.5 rounded-full bg-navy-mid px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-navy font-ui"
              >
                <LayoutDashboard className="size-4" aria-hidden />
                {dashboardLabel}
              </Link>
            )}
            <UserChip user={user} />
          </div>
        ) : (
          <div className="hidden items-center gap-1.5 lg:flex">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-navy font-ui"
            >
              <UserRound className="size-4" aria-hidden />
              Sign in
            </Link>
            <Link
              href={isDevPage ? "/signup?role=developer" : "/signup"}
              className="rounded-full bg-navy-mid px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-navy font-ui"
            >
              Sign up
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-full text-navy transition hover:bg-blue-mist lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/97 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between p-5">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Image src="/somahorse-logo.png" alt="" width={34} height={34} className="size-8 rounded-full object-contain" />
                <span className="font-display text-lg font-bold text-navy">
                  Somahorse<span className="text-blue-vivid">.ai</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-xl border border-border"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {user ? (
              <div className="mx-5 mb-2 flex items-center gap-3 rounded-2xl border border-border bg-blue-mist/60 p-4">
                <Avatar initials={user.initials} className="size-11 text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-ui text-sm font-bold text-navy">
                    {user.fullName ?? "Your account"}
                  </p>
                  <p className="text-xs font-medium capitalize text-muted-foreground font-ui">
                    {user.role === "client" ? "Client" : "Developer"} · Signed in
                  </p>
                </div>
              </div>
            ) : null}

            <ul className="flex flex-col gap-1 px-5 pt-2">
              {[...NAV, { href: "#protection", label: "Protection" }].map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 font-ui text-xl font-semibold text-navy hover:bg-blue-mist"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 px-5">
              {user ? (
                <>
                  <Link
                    href={user.dashboardPath}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-center text-sm font-semibold text-navy font-ui"
                  >
                    <LayoutDashboard className="size-4" aria-hidden />
                    {dashboardLabel}
                  </Link>
                  {user.startProjectPath ? (
                    <Link
                      href={user.startProjectPath}
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-navy-mid px-4 py-3 text-center text-sm font-semibold text-white font-ui"
                    >
                      Start a project
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-border px-4 py-3 text-center text-sm font-semibold text-navy font-ui"
                  >
                    Sign in
                  </Link>
                  <Link
                    href={isDevPage ? "/signup?role=developer" : "/signup"}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-navy-mid px-4 py-3 text-center text-sm font-semibold text-white font-ui"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function UserChip({ user }: { user: MarketingUser }) {
  return (
    <Link
      href={user.dashboardPath}
      aria-label={`${user.fullName ?? "Your account"} — open dashboard`}
      className="flex items-center gap-2 rounded-full border border-border bg-white/70 py-1 pl-1 pr-3 transition hover:border-border-strong hover:bg-white font-ui"
    >
      <Avatar initials={user.initials} className="size-7 text-[11px]" />
      <span className="max-w-[8rem] truncate text-sm font-semibold text-navy">
        {user.firstName ?? "Account"}
      </span>
    </Link>
  );
}

function Avatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-mid to-blue-vivid font-display font-bold text-white ${className}`}
    >
      {initials}
    </span>
  );
}
