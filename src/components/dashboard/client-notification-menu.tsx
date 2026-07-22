"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, MessageCircle } from "lucide-react";

import type { DashboardNotification } from "@/lib/dashboard/notifications";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ClientNotificationMenu({
  notifications,
  open,
  onToggle,
  mobile = false,
}: {
  notifications: DashboardNotification[];
  open: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={onToggle}
        className="relative grid size-9 place-items-center rounded-full border border-border/80 bg-white/85 text-navy-mid shadow-soft transition hover:bg-blue-mist"
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent-amber px-1 text-[8px] font-bold leading-4 text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -7, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -7, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={`z-50 overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-2 shadow-elevated backdrop-blur-2xl ${
              mobile ? "fixed left-3 right-3 top-[4.35rem]" : "absolute right-0 top-12 w-[23rem]"
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div>
                <p className="font-display text-base font-bold text-navy">Notifications</p>
                <p className="text-[11px] text-muted-foreground">Project messages and important updates</p>
              </div>
              <span className="grid size-8 place-items-center rounded-full bg-accent-teal/10 text-accent-teal">
                <CheckCheck className="size-4" aria-hidden />
              </span>
            </div>
            {notifications.length ? (
              <div className="max-h-[22rem] space-y-1 overflow-y-auto">
                {notifications.map((notification) => {
                  const href = notification.project_id
                    ? notification.type === "project_message"
                      ? `/dashboard/client/messages?project=${notification.project_id}`
                      : `/dashboard/client/projects/${notification.project_id}`
                    : "/dashboard/client";
                  return (
                    <Link
                      key={notification.id}
                      href={href}
                      onClick={onToggle}
                      className={`relative flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-blue-mist ${
                        notification.read_at ? "bg-white/50" : "bg-blue-light/55"
                      }`}
                    >
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-blue-vivid shadow-soft">
                        {notification.type === "project_message" ? <MessageCircle className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate pr-3 text-xs font-bold text-navy">{notification.title}</span>
                        <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">{notification.message}</span>
                        <span className="mt-1.5 block text-[10px] font-semibold text-blue-vivid">{formatRelativeDate(notification.created_at)}</span>
                      </span>
                      {!notification.read_at ? <span className="absolute right-3 top-3 size-2 rounded-full bg-blue-vivid" /> : null}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-blue-light/40 px-4 py-8 text-center">
                <Bell className="mx-auto size-5 text-blue-vivid/45" aria-hidden />
                <p className="mt-2 text-xs font-bold text-navy">You&apos;re all caught up</p>
                <p className="mt-1 text-[11px] text-muted-foreground">New project activity will appear here.</p>
              </div>
            )}
            <Link href="/dashboard/client/messages" onClick={onToggle} className="mt-2 flex items-center justify-center rounded-2xl py-2.5 text-xs font-bold text-navy-mid transition hover:bg-blue-mist">
              Open all messages
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(date);
}
