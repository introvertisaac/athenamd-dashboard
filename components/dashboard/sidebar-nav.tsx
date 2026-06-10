"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Lock } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { useAuth } from "@/components/auth-provider";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/nav";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { clinicalAccess } = useAuth();
  const [emergencyCount, setEmergencyCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const poll = () => {
      api.admin.emergency.list({ limit: 1, status: "DETECTED" })
        .then((r) => { if (!cancelled) setEmergencyCount(r.total); })
        .catch(() => { /* non-critical — badge stays at last known value */ });
    };
    poll();
    const id = setInterval(poll, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const visibleItems = NAV_ITEMS.filter(
    (i) => !i.clinical || clinicalAccess,
  );
  const visibleGroups = NAV_GROUPS.filter((g) =>
    visibleItems.some((i) => i.group === g),
  );

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link href="/overview" onClick={onNavigate}>
          <Wordmark size="md" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {visibleGroups.map((group) => (
          <div key={group} className="space-y-1">
            <p className="flex items-center gap-1.5 px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {group}
              {group === "Clinical" && <Lock className="size-3" />}
            </p>
            {visibleItems
              .filter((i) => i.group === group)
              .map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                    )}
                    <Icon
                      className={cn(
                        "size-4.5 shrink-0",
                        active
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {(() => {
                      const badge = item.href === "/emergency" ? emergencyCount : (item.badge ?? 0);
                      return !!badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] font-semibold text-destructive-foreground">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      );
                    })()}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/60 p-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-4 text-sidebar-primary" />
            <p className="text-sm font-semibold text-sidebar-accent-foreground">
              Need help?
            </p>
          </div>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            Check the operations runbook or reach the platform team.
          </p>
          <a
            href="mailto:platform@metaboai.com"
            className="mt-2 inline-block text-xs font-semibold text-sidebar-primary hover:underline"
          >
            Contact platform team →
          </a>
        </div>
      </div>
    </div>
  );
}
