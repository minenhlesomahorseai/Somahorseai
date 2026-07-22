"use client";

import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
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
  const isAgriPage = pathname === "/agriculture";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const isAgriTop = isAgriPage && !scrolled;

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
      className="fixed inset-x-0 top-0 z-[1000] flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
    >
      {/* ── Desktop nav bar ── */}
      <div
        className={[
          "flex items-center w-full relative transition-all duration-300",
          scrolled
            ? isAgriPage
              ? "max-w-5xl rounded-full border border-emerald-200/60 bg-white/85 shadow-nav backdrop-blur-xl px-3 py-2"
              : "max-w-5xl rounded-full border border-border bg-white/85 shadow-nav backdrop-blur-xl px-3 py-2"
            : "max-w-[1400px] border-transparent px-3 py-2",
        ].join(" ")}
      >
        {/* Logo */}
        <Link
          href="/"
          className="focus:outline-none rounded-full transition-transform hover:scale-105 flex items-center gap-2.5 shrink-0"
        >
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={36}
            height={36}
            className={`size-9 rounded-full object-contain cursor-pointer ${isAgriPage ? "agri-logo-green" : ""}`}
            priority
          />
          <span className={`text-[15px] font-bold hidden sm:inline transition-colors ${isAgriPage ? "text-emerald-700" : "text-navy"}`}>
            Somahorse<span className={isAgriPage ? "text-emerald-500" : "text-blue-vivid"}>.ai</span>
          </span>
        </Link>

        {/* Center nav links */}
        <nav className="hidden md:flex h-full ml-auto mr-auto" aria-label="Main navigation">
          <ul className="flex h-full items-center gap-1">
            {NAV.map((item, i) => (
              <motion.li
                key={item.href}
                className="relative"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: EASE }}
              >
                <Link
                  href={item.href}
                  className={[
                    "relative px-3.5 py-1.5 text-[13px] font-medium transition-colors focus:outline-none",
                    pathname === item.href
                      ? isAgriTop
                        ? "text-white after:absolute after:inset-x-3.5 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-emerald-300"
                        : isAgriPage
                          ? "text-emerald-700"
                          : "text-navy"
                      : isAgriTop
                        ? "text-white/80 hover:text-white"
                        : isAgriPage
                          ? "text-muted-foreground hover:text-emerald-700"
                          : "text-muted-foreground hover:text-navy",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5 ml-auto md:ml-0 shrink-0">
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.startProjectPath ? (
                <Link
                  href={user.startProjectPath}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all focus:outline-none ${isAgriTop ? "bg-white text-emerald-800 hover:bg-white/90" : isAgriPage ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-navy-mid text-white hover:bg-navy"}`}
                >
                  Start a project
                </Link>
              ) : (
                <Link
                  href={user.dashboardPath}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all focus:outline-none ${isAgriTop ? "bg-white text-emerald-800 hover:bg-white/90" : isAgriPage ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-navy-mid text-white hover:bg-navy"}`}
                >
                  <LayoutDashboard className="size-4" aria-hidden />
                  {dashboardLabel}
                </Link>
              )}
              <UserChip user={user} />
            </div>
          ) : (
            <motion.div
              className="hidden md:flex items-center gap-4 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            >
              <Link
                href="/login"
                className={`px-3.5 py-1.5 text-[13px] font-medium transition-colors focus:outline-none ${isAgriTop ? "text-white hover:text-white/80" : isAgriPage ? "text-navy hover:text-emerald-600" : "text-navy hover:text-blue-vivid"}`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all focus:outline-none ${isAgriTop ? "bg-white text-emerald-800 hover:bg-white/90" : isAgriPage ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-navy-mid text-white hover:bg-navy"}`}
              >
                Sign up
              </Link>
            </motion.div>
          )}

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="transition-all hover:opacity-80 active:scale-90 focus:outline-none rounded-full p-2 hover:bg-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Menu className={`h-5 w-5 ${isAgriTop ? "text-white" : "text-navy"}`} aria-hidden />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Mobile full-screen overlay menu (Olyxee style) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 mobile-menu-glass md:hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="h-full flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-2">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                  <Image
                    src="/somahorse-logo.png"
                    alt=""
                    width={34}
                    height={34}
                    className={`size-8 rounded-full object-contain ${isAgriPage ? "agri-logo-green" : ""}`}
                  />
                  <span className={`text-lg font-bold ${isAgriPage ? "text-emerald-700" : "text-navy"}`}>
                    Somahorse<span className={isAgriPage ? "text-emerald-500" : "text-blue-vivid"}>.ai</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-10 place-items-center rounded-full hover:bg-black/5 transition-colors"
                >
                  <X className="size-5 text-navy" aria-hidden />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 px-7 pt-8">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i, ease: EASE }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="mobile-menu-item"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bottom section — Sign in */}
              <div className="px-7 pb-8 mt-auto">
                {user ? (
                  <div className="space-y-3">
                    <div className="mobile-menu-signin-card flex items-center gap-3">
                      <Avatar initials={user.initials} className="size-10 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy">
                          {user.fullName ?? "Your account"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.role === "client" ? "Client" : "Developer"} · Signed in
                        </p>
                      </div>
                    </div>
                    <Link
                      href={user.dashboardPath}
                      onClick={() => setOpen(false)}
                      className="mobile-menu-signin-card flex items-center justify-between w-full"
                    >
                      <div>
                        <p className="text-sm font-semibold text-navy">Dashboard</p>
                        <p className="text-xs text-muted-foreground">Manage your projects</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                    {user.startProjectPath && (
                      <Link
                        href={user.startProjectPath}
                        onClick={() => setOpen(false)}
                        className="mobile-menu-signin-card flex items-center justify-between w-full"
                      >
                        <div>
                          <p className="text-sm font-semibold text-navy">Start a project</p>
                          <p className="text-xs text-muted-foreground">Describe your problem</p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="cue text-muted-foreground mb-4">Sign in to</p>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="mobile-menu-signin-card flex items-center justify-between w-full"
                    >
                      <div>
                        <p className="text-sm font-semibold text-navy">Client Portal</p>
                        <p className="text-xs text-muted-foreground">Project tracking and management</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                    <Link
                      href={isDevPage ? "/signup?role=developer" : "/signup"}
                      onClick={() => setOpen(false)}
                      className="mobile-menu-signin-card flex items-center justify-between w-full"
                    >
                      <div>
                        <p className="text-sm font-semibold text-navy">Developer Network</p>
                        <p className="text-xs text-muted-foreground">Join · get certified · build</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
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
