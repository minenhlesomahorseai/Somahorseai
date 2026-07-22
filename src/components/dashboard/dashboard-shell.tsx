"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { DashboardNotification } from "@/lib/dashboard/notifications";
import { createClient } from "@/lib/supabase/client";
import type { DashboardUser } from "./dashboard-user";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";
import { ClientNotificationMenu } from "./client-notification-menu";

export function DashboardShell({
  user,
  userId,
  initialNotifications,
  children,
}: {
  user: DashboardUser;
  userId: string;
  initialNotifications: DashboardNotification[];
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadMessageCount = notifications.filter(
    (notification) => notification.type === "project_message" && !notification.read_at
  ).length;

  useEffect(() => {
    const client = createClient();
    const channel = client
      .channel(`client-notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
        (payload) => {
          const incoming = payload.new as DashboardNotification;
          if (!incoming?.id) return;
          setNotifications((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(0, 30));
        }
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [userId]);

  const toggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (!nextOpen) return;
    const unreadIds = notifications.filter((notification) => !notification.read_at).map((notification) => notification.id);
    if (!unreadIds.length) return;
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        unreadIds.includes(notification.id) ? { ...notification, read_at: readAt } : notification
      )
    );
    void createClient().from("notifications").update({ read_at: readAt }).in("id", unreadIds);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background hero-field">
      <TopNav
        user={user}
        notifications={notifications}
        notificationsOpen={notificationsOpen}
        onToggleNotifications={toggleNotifications}
        unreadMessageCount={unreadMessageCount}
      />

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
          <ClientNotificationMenu
            mobile
            notifications={notifications}
            open={notificationsOpen}
            onToggle={toggleNotifications}
          />
          <Link
            href="/dashboard/client/profile"
            aria-label="Profile"
            className="grid size-9 place-items-center rounded-full bg-navy text-xs font-bold text-white"
          >
            {user.initials}
          </Link>
        </div>
      </header>

      <main className="mx-auto min-w-0 w-full max-w-7xl overflow-x-clip px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-7">
        {children}
      </main>

      <BottomNav unreadMessageCount={unreadMessageCount} />
    </div>
  );
}
