import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";

import type { DashboardUser } from "./dashboard-user";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";

export function DashboardShell({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background hero-field">
      <TopNav user={user} />

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard/client" className="flex items-center gap-2">
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={30}
            height={30}
            className="size-8 rounded-full object-contain"
            priority
          />
          <span className="font-display text-sm font-bold text-navy">
            Somahorse<span className="text-blue-vivid">.ai</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-full border border-border/70 bg-white/80 text-navy-mid"
          >
            <Bell className="size-4" aria-hidden />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent-amber" />
          </button>
          <Link
            href="/dashboard/client/profile"
            aria-label="Profile"
            className="grid size-9 place-items-center rounded-full bg-navy text-xs font-bold text-white"
          >
            {user.initials}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-7">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
