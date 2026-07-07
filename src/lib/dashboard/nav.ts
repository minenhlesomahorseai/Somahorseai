import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  UsersRound,
  Activity,
  MessagesSquare,
  CreditCard,
  UserRound,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short label used on the mobile bottom tab bar. */
  shortLabel?: string;
  description?: string;
}

const BASE = "/dashboard/client";

/**
 * Full client navigation. The order matters: the first four are surfaced as
 * functional tabs on the mobile bottom bar, the rest live behind the "More"
 * drawer. On desktop every item is shown in the top navigation pill.
 */
export const CLIENT_NAV: NavItem[] = [
  {
    href: BASE,
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Your command centre",
  },
  {
    href: `${BASE}/projects`,
    label: "Projects",
    shortLabel: "Projects",
    icon: FolderKanban,
    description: "Scoped & live builds",
  },
  {
    href: `${BASE}/developers`,
    label: "Developers",
    shortLabel: "Devs",
    icon: UsersRound,
    description: "Your certified team",
  },
  {
    href: `${BASE}/monitoring`,
    label: "Monitoring",
    shortLabel: "Monitor",
    icon: Activity,
    description: "Live system health",
  },
  {
    href: `${BASE}/messages`,
    label: "Messages",
    shortLabel: "Inbox",
    icon: MessagesSquare,
    description: "Talk to your agent",
  },
  {
    href: `${BASE}/billing`,
    label: "Billing",
    shortLabel: "Billing",
    icon: CreditCard,
    description: "Invoices & monitoring",
  },
  {
    href: `${BASE}/profile`,
    label: "Profile",
    shortLabel: "Profile",
    icon: UserRound,
    description: "Your company profile",
  },
  {
    href: `${BASE}/settings`,
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    description: "Account & preferences",
  },
];

/** Functional tabs that always stay on the mobile bottom bar. */
export const MOBILE_PRIMARY_COUNT = 4;

export const NEW_PROJECT_HREF = `${BASE}/new-project`;

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === BASE) {
    return pathname === BASE;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
