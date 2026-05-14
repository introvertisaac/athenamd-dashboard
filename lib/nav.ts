import {
  BarChart3,
  Cable,
  ClipboardList,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "Workspace" | "Operations" | "System" | "Clinical";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
  /** Only visible to staff with clinical data access. */
  clinical?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard, group: "Workspace" },
  { label: "Users", href: "/users", icon: Users, group: "Workspace" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, group: "Workspace" },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard, group: "Operations" },
  { label: "Onboarding", href: "/onboarding", icon: ClipboardList, group: "Operations" },
  { label: "Integrations", href: "/integrations", icon: Cable, group: "Operations" },
  { label: "Audit Logs", href: "/audit-logs", icon: ScrollText, group: "System" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
  {
    label: "Clinical Labs",
    href: "/labs",
    icon: FlaskConical,
    group: "Clinical",
    clinical: true,
  },
];

export const NAV_GROUPS: NavGroup[] = [
  "Workspace",
  "Operations",
  "System",
  "Clinical",
];
