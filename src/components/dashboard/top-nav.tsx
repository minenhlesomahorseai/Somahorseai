"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, Settings } from "lucide-react";

import { CLIENT_NAV, NEW_PROJECT_HREF, isNavItemActive } from "@/lib/dashboard/nav";
import type { DashboardUser } from "./dashboard-user";

export function TopNav({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  // The settings entry lives in the right-hand cluster, not the centre pill.
  const centreItems = CLIENT_NAV.filter((item) => item.href !== "/dashboard/client/settings");

  return (
    <header className="sticky top-0 z-40 hidden bg-background/70 px-4 pt-4 backdrop-blur-xl lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/dashboard/client" className="flex shrink-0 items-center gap-2">
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={34}
            height={34}
            className="size-9 rounded-full object-contain"
            priority
          />
          <span className="font-display text-[15px] font-bold tracking-tight text-navy">
            Somahorse<span className="text-blue-vivid">.ai</span>
          </span>
        </Link>

        <nav
          aria-label="Dashboard"
          className="flex items-center gap-1 rounded-full border border-border/80 bg-white/80 p-1.5 shadow-nav backdrop-blur-xl"
        >
          {centreItems.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition font-ui ${
                  active
                    ? "bg-navy text-white shadow-glow"
                    : "text-muted-foreground hover:bg-blue-mist hover:text-navy"
                }`}
              >
                <Icon className="size-3.5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={NEW_PROJECT_HREF}
            className="flex items-center gap-1.5 rounded-full bg-navy-mid px-4 py-2 text-[13px] font-semibold text-white shadow-glow transition hover:bg-navy font-ui"
          >
            <Plus className="size-4" aria-hidden />
            New project
          </Link>
          <Link
            href="/dashboard/client/settings"
            aria-label="Settings"
            className={`grid size-9 place-items-center rounded-full border border-border/80 bg-white/80 text-navy-mid transition hover:bg-blue-mist ${
              isNavItemActive(pathname, "/dashboard/client/settings") ? "ring-2 ring-blue-vivid/30" : ""
            }`}
          >
            <Settings className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-full border border-border/80 bg-white/80 text-navy-mid transition hover:bg-blue-mist"
          >
            <Bell className="size-4" aria-hidden />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent-amber" />
          </button>
          <Link
            href="/dashboard/client/profile"
            aria-label="Profile"
            className="grid size-9 place-items-center rounded-full bg-navy text-xs font-bold text-white shadow-soft transition hover:bg-navy-mid"
          >
            {user.initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
