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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: "Workspace" | "Operations" | "System";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard, group: "Workspace" },
  { label: "Patients", href: "/patients", icon: Users, group: "Workspace" },
  { label: "Labs", href: "/labs", icon: FlaskConical, group: "Workspace" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, group: "Workspace" },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard, group: "Operations" },
  { label: "Onboarding", href: "/onboarding", icon: ClipboardList, group: "Operations" },
  { label: "Integrations", href: "/integrations", icon: Cable, group: "Operations" },
  { label: "Audit Logs", href: "/audit-logs", icon: ScrollText, group: "System" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const NAV_GROUPS = ["Workspace", "Operations", "System"] as const;
