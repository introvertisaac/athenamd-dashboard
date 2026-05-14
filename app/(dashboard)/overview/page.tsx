"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CreditCard,
  TriangleAlert,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import {
  AccountStatusBadge,
  EngagementBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import {
  DonutChart,
  MultiLineChart,
  TrendAreaChart,
} from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  analyticsOverview,
  getUserEngagement,
  signupSeries,
  usageSeries,
  USERS,
} from "@/lib/data";
import { compactNumber, currency, relativeTime } from "@/lib/utils";

export default function OverviewPage() {
  const stats = analyticsOverview();
  const series = signupSeries();
  const usage = usageSeries();

  const tierColors: Record<string, string> = {
    FREE: "var(--chart-4)",
    PRO: "var(--chart-2)",
    PREMIUM: "var(--chart-1)",
  };
  const donutData = stats.tierBreakdown.map((t) => ({
    name: t.tier,
    value: t.count,
    color: tierColors[t.tier],
  }));

  const recentUsers = [...USERS]
    .sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt))
    .slice(0, 6);

  const needsAttention = USERS.filter(
    (u) =>
      u.status === "locked" ||
      u.subscription.status === "PAST_DUE" ||
      u.subscription.cancelAtPeriodEnd ||
      !u.onboardingComplete,
  ).slice(0, 5);

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Monthly recurring revenue"
          value={currency(stats.mrr)}
          icon={CreditCard}
          delta={8}
          hint={`${currency(stats.arr)} ARR`}
          accent="success"
        />
        <StatCard
          index={1}
          label="Total users"
          value={stats.total}
          icon={Users}
          delta={12}
          hint={`${stats.payingCount} paying`}
        />
        <StatCard
          index={2}
          label="Weekly active users"
          value={stats.wau}
          icon={Zap}
          delta={5}
          hint={`${stats.dau} active today`}
          accent="info"
        />
        <StatCard
          index={3}
          label="New signups this week"
          value={stats.newThisWeek}
          icon={UserPlus}
          delta={18}
          hint={`${stats.newThisMonth} this month`}
          accent="primary"
        />
      </div>

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
              <TrendAreaChart
                data={series}
                dataKey="activeUsers"
                xKey="month"
                formatter={(v) => compactNumber(v)}
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
            <MultiLineChart
              data={usage}
              xKey="date"
              series={[
                { key: "activeUsers", color: "var(--chart-1)" },
                { key: "sessions", color: "var(--chart-4)" },
              ]}
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
            {needsAttention.map((u) => {
              const reason = !u.onboardingComplete
                ? "Onboarding incomplete"
                : u.status === "locked"
                  ? "Account locked"
                  : u.subscription.status === "PAST_DUE"
                    ? "Payment past due"
                    : "Subscription cancelling";
              return (
                <Link
                  key={u.id}
                  href={`/users/${u.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <PatientAvatar name={u.name} color={u.avatarColor} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {reason}
                    </p>
                  </div>
                </Link>
              );
            })}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead className="pr-5 text-right">Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => {
                    window.location.href = `/users/${u.id}`;
                  }}
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <PatientAvatar name={u.name} color={u.avatarColor} />
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={u.subscription.tier} />
                  </TableCell>
                  <TableCell>
                    <SubStatusBadge status={u.subscription.status} />
                  </TableCell>
                  <TableCell>
                    <AccountStatusBadge status={u.status} />
                  </TableCell>
                  <TableCell>
                    <EngagementBadge level={getUserEngagement(u.id).level} />
                  </TableCell>
                  <TableCell className="pr-5 text-right text-sm text-muted-foreground">
                    {relativeTime(u.lastActivityAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
