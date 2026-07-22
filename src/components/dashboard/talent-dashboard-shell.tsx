"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, LogOut, MoreHorizontal, Settings, X } from "lucide-react";

import {
  TALENT_MOBILE_PRIMARY_COUNT,
  TALENT_NAV,
  isNavItemActive,
} from "@/lib/dashboard/nav";
import type { TalentNotification } from "@/lib/dashboard/talent";
import { createClient } from "@/lib/supabase/client";
import type { DashboardUser } from "./dashboard-user";

const EASE = [0.16, 1, 0.3, 1] as const;

export function TalentDashboardShell({
  user,
  userId,
  notifications,
  inviteCount,
  children,
}: {
  user: DashboardUser;
  userId: string;
  notifications: TalentNotification[];
  inviteCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState(notifications);
  const [seenNotifications, setSeenNotifications] = useState<string[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  const primary = TALENT_NAV.slice(0, TALENT_MOBILE_PRIMARY_COUNT);
  const overflow = TALENT_NAV.slice(TALENT_MOBILE_PRIMARY_COUNT);
  const centreItems = TALENT_NAV.filter((item) => !item.href.endsWith("/settings"));
  const moreActive = overflow.some((item) => isNavItemActive(pathname, item.href));
  const unreadIds = useMemo(
    () => notificationItems.filter((item) => !item.read_at && !seenNotifications.includes(item.id)).map((item) => item.id),
    [notificationItems, seenNotifications]
  );

  useEffect(() => {
    const client = createClient();
    const channel = client
      .channel(`talent-notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
        (payload) => {
          const incoming = payload.new as TalentNotification;
          if (!incoming?.id) return;
          setNotificationItems((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(0, 30));
        }
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const openNotifications = async () => {
    setNotificationsOpen((open) => !open);
    if (unreadIds.length === 0) return;
    setSeenNotifications((current) => [...new Set([...current, ...unreadIds])]);
    const readAt = new Date().toISOString();
    setNotificationItems((current) => current.map((item) => unreadIds.includes(item.id) ? { ...item, read_at: readAt } : item));
    await createClient()
      .from("notifications")
      .update({ read_at: readAt })
      .in("id", unreadIds);
  };

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
    <div className="talent-field min-h-screen">
      <header className="sticky top-0 z-40 hidden px-4 pt-4 lg:block">
        <div className="talent-nav-glass mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-[1.4rem] px-3 py-2">
          <Link href="/dashboard/talent" className="flex shrink-0 items-center gap-2.5 px-1">
            <Image
              src="/somahorse-logo.png"
              alt="Somahorse.ai"
              width={36}
              height={36}
              className="size-9 rounded-full object-contain"
              priority
            />
            <span className="font-display text-[15px] font-bold tracking-tight text-navy">
              Somahorse<span className="text-blue-vivid">.ai</span>
            </span>
          </Link>

          <nav aria-label="Talent dashboard" className="flex items-center gap-0.5 rounded-full bg-white/45 p-1">
            {centreItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              const badge = item.href.endsWith("/invites") && inviteCount > 0 ? inviteCount : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition-all duration-200 xl:px-3.5 ${
                    active
                      ? "bg-navy text-white shadow-glow"
                      : "text-muted-foreground hover:bg-white/80 hover:text-navy"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.label}
                  {badge ? (
                    <span className="grid min-w-4 place-items-center rounded-full bg-accent-amber px-1 text-[9px] font-bold leading-4 text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard/talent/settings"
              aria-label="Settings"
              className={`grid size-9 place-items-center rounded-full border border-white/70 bg-white/65 text-navy-mid transition hover:bg-white ${
                isNavItemActive(pathname, "/dashboard/talent/settings") ? "ring-2 ring-blue-vivid/30" : ""
              }`}
            >
              <Settings className="size-4" aria-hidden />
            </Link>
            <NotificationButton
              open={notificationsOpen}
              unreadCount={unreadIds.length}
              onClick={openNotifications}
            >
              <NotificationPanel notifications={notificationItems} seen={seenNotifications} onSelect={() => setNotificationsOpen(false)} />
            </NotificationButton>
            <Link
              href="/dashboard/talent/profile"
              aria-label="Profile"
              className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-vivid text-xs font-bold text-white shadow-glow transition hover:scale-[1.04]"
            >
              {user.initials}
            </Link>
          </div>
        </div>
      </header>

      <header className="talent-mobile-header sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Link href="/dashboard/talent" className="flex items-center gap-2">
          <Image
            src="/somahorse-logo.png"
            alt="Somahorse.ai"
            width={32}
            height={32}
            className="size-8 rounded-full object-contain"
            priority
          />
          <span className="font-display text-sm font-bold text-navy">
            Somahorse<span className="text-blue-vivid">.ai</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationButton
            mobile
            open={notificationsOpen}
            unreadCount={unreadIds.length}
            onClick={openNotifications}
          >
            <NotificationPanel mobile notifications={notificationItems} seen={seenNotifications} onSelect={() => setNotificationsOpen(false)} />
          </NotificationButton>
          <Link
            href="/dashboard/talent/profile"
            aria-label="Profile"
            className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-vivid text-xs font-bold text-white shadow-soft"
          >
            {user.initials}
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-7">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {children}
        </motion.div>
      </main>

      <nav
        aria-label="Talent dashboard"
        className="talent-bottom-nav fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
          {primary.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            const badge = item.href.endsWith("/invites") && inviteCount > 0 ? inviteCount : null;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                    active ? "text-navy" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`relative flex h-7 w-12 items-center justify-center rounded-full transition ${
                      active ? "bg-blue-vivid/12 text-blue-vivid" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {badge ? <span className="absolute -right-0.5 -top-1 size-2 rounded-full bg-accent-amber ring-2 ring-white" /> : null}
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
                  moreActive ? "bg-blue-vivid/12 text-blue-vivid" : "text-muted-foreground"
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
        {drawerOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More talent dashboard pages"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.55 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 550) setDrawerOpen(false);
              }}
              className="talent-drawer fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden"
            >
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-12 rounded-full bg-navy/15" />
              </div>
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-vivid">Workspace</p>
                  <h2 className="font-display text-xl font-bold text-navy">More</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full border border-border bg-white/70 text-navy-mid"
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
                      className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3.5 transition ${
                        active
                          ? "border-blue-vivid/35 bg-blue-vivid/10"
                          : "border-white/80 bg-white/60 active:scale-[0.98]"
                      }`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-blue-vivid shadow-soft">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-navy">{item.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 px-5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white/65 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition hover:text-navy disabled:opacity-60"
                >
                  <LogOut className="size-4" aria-hidden /> {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NotificationButton({
  mobile = false,
  open,
  unreadCount,
  onClick,
  children,
}: {
  mobile?: boolean;
  open: boolean;
  unreadCount: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={onClick}
        className={`relative grid size-9 place-items-center rounded-full border border-white/70 bg-white/65 text-navy-mid transition hover:bg-white ${
          mobile ? "shadow-soft" : ""
        }`}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid size-2.5 place-items-center rounded-full bg-accent-amber ring-2 ring-white" />
        ) : null}
      </button>
      <AnimatePresence>{open ? children : null}</AnimatePresence>
    </div>
  );
}

function NotificationPanel({
  notifications,
  seen,
  onSelect,
  mobile = false,
}: {
  notifications: TalentNotification[];
  seen: string[];
  onSelect: () => void;
  mobile?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={`talent-nav-glass z-50 overflow-hidden rounded-3xl p-2 shadow-elevated ${
        mobile ? "fixed left-4 right-4 top-[4.4rem]" : "absolute right-0 top-12 w-[22rem]"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div>
          <p className="font-display text-base font-bold text-navy">Notifications</p>
          <p className="text-[11px] text-muted-foreground">Updates from your talent workspace</p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-accent-teal/10 text-accent-teal">
          <Check className="size-4" aria-hidden />
        </span>
      </div>
      {notifications.length ? (
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {notifications.map((item) => {
            const unread = !item.read_at && !seen.includes(item.id);
            return (
              <Link href={item.project_id ? `/dashboard/talent/projects/${item.project_id}?tab=messages` : "/dashboard/talent"} onClick={onSelect} key={item.id} className="relative block rounded-2xl bg-white/65 px-3 py-3 transition hover:bg-white">
                {unread ? <span className="absolute right-3 top-3 size-2 rounded-full bg-blue-vivid" /> : null}
                <p className="pr-4 text-xs font-bold text-navy">{item.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.message}</p>
                <p className="mt-1.5 text-[10px] font-medium text-blue-vivid">{formatRelativeDate(item.created_at)}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/60 px-4 py-7 text-center">
          <Bell className="mx-auto size-5 text-blue-vivid/50" aria-hidden />
          <p className="mt-2 text-xs font-semibold text-navy">You&apos;re all caught up</p>
          <p className="mt-1 text-[11px] text-muted-foreground">New invites and project updates will appear here.</p>
        </div>
      )}
    </motion.div>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(date);
}
