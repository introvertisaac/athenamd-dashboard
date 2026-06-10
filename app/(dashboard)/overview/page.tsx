"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock,
  CreditCard,
  TriangleAlert,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import {
  AccountStatusBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import { DonutChart } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type AnalyticsOverview, type UserListItem } from "@/lib/api";
import type { AccountStatus } from "@/lib/types";
import { compactNumber, relativeTime } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#0f766e", "#0284c7", "#7c3aed", "#b45309",
  "#be185d", "#15803d", "#c2410c", "#1d4ed8",
];

function emailToName(email: string): string {
  const handle = email.split("@")[0] || "user";
  return handle
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function emailToColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function deriveAccountStatus(u: UserListItem): AccountStatus {
  if (u.deletedAt) return "deleted";
  if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) return "locked";
  return "active";
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [analytics, setAnalytics] = React.useState<AnalyticsOverview | null>(null);
  const [users, setUsers] = React.useState<UserListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.admin.analytics.overview(),
        api.admin.users.list({ page: 1, limit: 20 }),
      ]);
      setAnalytics(analyticsRes);
      setUsers(usersRes.data);
    } catch {
      setError(true);
      toast.error("Failed to load overview data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const tierColors: Record<string, string> = {
    FREE: "var(--chart-4)",
    PRO: "var(--chart-2)",
    PREMIUM: "var(--chart-1)",
  };

  const donutData = analytics?.tierBreakdown.map((t) => ({
    name: t.tier,
    value: t.count,
    color: tierColors[t.tier],
  })) ?? [];

  const recentUsers = [...users]
    .sort((a, b) => {
      const aTime = a.lastLoginAt ? +new Date(a.lastLoginAt) : 0;
      const bTime = b.lastLoginAt ? +new Date(b.lastLoginAt) : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const needsAttention = users.filter((u) => {
    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
    const isPastDue = u.subscription?.status === "PAST_DUE";
    return isLocked || isPastDue;
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Revenue, growth, and platform usage at a glance."
      >
        <Button variant="outline" asChild>
          <Link href="/analytics">
            View analytics
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/users">
            <Users className="size-4" />
            All users
          </Link>
        </Button>
      </PageHeader>

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[106px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <TriangleAlert className="size-4 shrink-0 text-warning" />
          Failed to load stats.
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            label="Monthly recurring revenue"
            value="—"
            icon={CreditCard}
            hint="Requires Stripe price data"
            accent="success"
          />
          <StatCard
            index={1}
            label="Total users"
            value={compactNumber(analytics?.totalUsers ?? 0)}
            icon={Users}
            hint={`${analytics?.activeSubscriptions ?? 0} active subscriptions`}
          />
          <StatCard
            index={2}
            label="Weekly active users"
            value="—"
            icon={Zap}
            hint="Coming in Workstream B"
            accent="info"
          />
          <StatCard
            index={3}
            label="New signups today"
            value={analytics?.newUsersToday ?? 0}
            icon={UserPlus}
            accent="primary"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Growth</CardTitle>
              <CardDescription>
                Cumulative active users over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Clock}
                title="Time-series data coming in Workstream B"
                description="Growth charts require date-bucketed backend endpoints that are not yet available."
                className="py-8"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Plan mix</CardTitle>
              <CardDescription>Users by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[140px] rounded-xl" />
              ) : donutData.length > 0 ? (
                <>
                  <DonutChart data={donutData} />
                  <div className="mt-3 space-y-2">
                    {donutData.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="capitalize text-muted-foreground">
                          {d.name.toLowerCase()}
                        </span>
                        <span className="ml-auto font-semibold tabular-nums">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState icon={Users} title="No tier data" className="py-6" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Usage + needs attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily active users</CardTitle>
            <CardDescription>
              Active users and sessions over the last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Clock}
              title="Time-series data coming in Workstream B"
              description="DAU charts require date-bucketed backend endpoints that are not yet available."
              className="py-8"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Billing & account issues</CardDescription>
            </div>
            <TriangleAlert className="size-4 text-warning" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              [0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[60px] rounded-lg" />
              ))
            ) : needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues found.</p>
            ) : (
              needsAttention.map((u) => {
                const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
                const reason = isLocked ? "Account locked" : "Payment past due";
                const name = emailToName(u.email);
                return (
                  <Link
                    key={u.id}
                    href={`/users/${u.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <PatientAvatar name={name} color={emailToColor(u.email)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{u.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {reason}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Recently active users</CardTitle>
            <CardDescription>Latest sign-ins and app activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/users">
              View all
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-px px-5 pb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-[52px] rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="pr-5 text-right">Last active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((u) => {
                    const name = emailToName(u.email);
                    const accountStatus = deriveAccountStatus(u);
                    return (
                      <TableRow
                        key={u.id}
                        className="cursor-pointer"
                        onClick={() => { window.location.href = `/users/${u.id}`; }}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <PatientAvatar name={name} color={emailToColor(u.email)} />
                            <div>
                              <p className="text-sm font-semibold">{name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.subscription ? (
                            <TierBadge tier={u.subscription.tier} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.subscription ? (
                            <SubStatusBadge status={u.subscription.status} />
                          ) : (
                            <span className="text-xs text-muted-foreground">No sub</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <AccountStatusBadge status={accountStatus} />
                        </TableCell>
                        <TableCell className="pr-5 text-right text-sm text-muted-foreground">
                          {u.lastLoginAt ? relativeTime(u.lastLoginAt) : "Never"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
