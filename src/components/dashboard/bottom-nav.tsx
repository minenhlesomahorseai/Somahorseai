"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, MoreHorizontal, Plus, X } from "lucide-react";

import {
  CLIENT_NAV,
  MOBILE_PRIMARY_COUNT,
  NEW_PROJECT_HREF,
  isNavItemActive,
} from "@/lib/dashboard/nav";
import { createClient } from "@/lib/supabase/client";

const EASE = [0.16, 1, 0.3, 1] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const primary = CLIENT_NAV.slice(0, MOBILE_PRIMARY_COUNT);
  const overflow = CLIENT_NAV.slice(MOBILE_PRIMARY_COUNT);
  const moreActive = overflow.some((item) => isNavItemActive(pathname, item.href));

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
      router.replace("/login");
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <>
      {/* Floating New project action — kept off the 5-tab bar so tabs never squash. */}
      <Link
        href={NEW_PROJECT_HREF}
        aria-label="New project"
        className="fixed bottom-[88px] right-4 z-40 flex size-14 items-center justify-center rounded-2xl bg-navy-mid text-white shadow-glow transition active:scale-95 lg:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>

      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
          {primary.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                    active ? "text-navy" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                      active ? "bg-blue-light text-navy-mid" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  {item.shortLabel ?? item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                moreActive ? "text-navy" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                  moreActive ? "bg-blue-light text-navy-mid" : "text-muted-foreground"
                }`}
              >
                <MoreHorizontal className="size-[18px]" aria-hidden />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              role="dialog"
              aria-label="More"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setDrawerOpen(false);
              }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-elevated lg:hidden"
            >
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-12 rounded-full bg-border-strong" />
              </div>
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <h2 className="font-ui text-lg font-bold text-navy">More</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full border border-border text-navy-mid"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 px-5 pt-2">
                {overflow.map((item) => {
                  const active = isNavItemActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition ${
                        active
                          ? "border-navy-mid bg-blue-light/60"
                          : "border-border bg-white hover:bg-blue-mist"
                      }`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-light/70 text-navy-mid">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-navy font-ui">{item.label}</span>
                        {item.description ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 px-5">
                <Link
                  href={NEW_PROJECT_HREF}
                  onClick={() => setDrawerOpen(false)}
                  className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-mid px-4 py-3.5 text-sm font-semibold text-white shadow-glow font-ui"
                >
                  <Plus className="size-4" aria-hidden /> New project
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border-strong bg-white px-4 py-3.5 text-sm font-semibold text-muted-foreground transition hover:text-navy disabled:opacity-60 font-ui"
                >
                  <LogOut className="size-4" aria-hidden /> {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
