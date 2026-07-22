import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CircleDollarSign,
  LayoutDashboard,
  FolderKanban,
  MailQuestion,
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

const CLIENT_BASE = "/dashboard/client";
const TALENT_BASE = "/dashboard/talent";

/**
 * Full client navigation. The order matters: the first four are surfaced as
 * functional tabs on the mobile bottom bar, the rest live behind the "More"
 * drawer. On desktop every item is shown in the top navigation pill.
 */
export const CLIENT_NAV: NavItem[] = [
  {
    href: CLIENT_BASE,
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Your command centre",
  },
  {
    href: `${CLIENT_BASE}/projects`,
    label: "Projects",
    shortLabel: "Projects",
    icon: FolderKanban,
    description: "Scoped & live builds",
  },
  {
    href: `${CLIENT_BASE}/developers`,
    label: "Developers",
    shortLabel: "Devs",
    icon: UsersRound,
    description: "Your certified team",
  },
  {
    href: `${CLIENT_BASE}/monitoring`,
    label: "Monitoring",
    shortLabel: "Monitor",
    icon: Activity,
    description: "Live system health",
  },
  {
    href: `${CLIENT_BASE}/messages`,
    label: "Messages",
    shortLabel: "Inbox",
    icon: MessagesSquare,
    description: "Talk to your agent",
  },
  {
    href: `${CLIENT_BASE}/billing`,
    label: "Billing",
    shortLabel: "Billing",
    icon: CreditCard,
    description: "Invoices & monitoring",
  },
  {
    href: `${CLIENT_BASE}/profile`,
    label: "Profile",
    shortLabel: "Profile",
    icon: UserRound,
    description: "Your company profile",
  },
  {
    href: `${CLIENT_BASE}/settings`,
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    description: "Account & preferences",
  },
];

/** Functional tabs that always stay on the mobile bottom bar. */
export const MOBILE_PRIMARY_COUNT = 4;

export const NEW_PROJECT_HREF = `${CLIENT_BASE}/new-project`;

/**
 * Talent navigation follows the same desktop/mobile pattern as the client
 * dashboard. The first four entries remain visible on the mobile tab bar and
 * every remaining destination is presented in the swipeable More sheet.
 */
export const TALENT_NAV: NavItem[] = [
  {
    href: TALENT_BASE,
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Your talent command centre",
  },
  {
    href: `${TALENT_BASE}/invites`,
    label: "Invites",
    shortLabel: "Invites",
    icon: MailQuestion,
    description: "New project opportunities",
  },
  {
    href: `${TALENT_BASE}/projects`,
    label: "Projects",
    shortLabel: "Projects",
    icon: FolderKanban,
    description: "Active and completed work",
  },
  {
    href: `${TALENT_BASE}/payments`,
    label: "Payments",
    shortLabel: "Payments",
    icon: CircleDollarSign,
    description: "Milestones and payouts",
  },
  {
    href: `${TALENT_BASE}/messages`,
    label: "Messages",
    shortLabel: "Inbox",
    icon: MessagesSquare,
    description: "Project conversations",
  },
  {
    href: `${TALENT_BASE}/assessment`,
    label: "Assessment",
    shortLabel: "Test",
    icon: BadgeCheck,
    description: "Score and certification",
  },
  {
    href: `${TALENT_BASE}/profile`,
    label: "Profile",
    shortLabel: "Profile",
    icon: UserRound,
    description: "Skills and public details",
  },
  {
    href: `${TALENT_BASE}/settings`,
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    description: "Account and notifications",
  },
];

export const TALENT_MOBILE_PRIMARY_COUNT = 4;

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === CLIENT_BASE || href === TALENT_BASE) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
