"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  FlaskConical,
  HeartPulse,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import {
  AccountStatusBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import {
  DonutChart,
  SingleBarChart,
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
  PATIENTS_ONLY,
  scoreDistribution,
  signupSeries,
} from "@/lib/data";
import { compactNumber, currency, relativeTime } from "@/lib/utils";

export default function OverviewPage() {
  const stats = analyticsOverview();
  const series = signupSeries();
  const dist = scoreDistribution();

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

  const recentPatients = [...PATIENTS_ONLY]
    .sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt))
    .slice(0, 6);

  const needsAttention = PATIENTS_ONLY.filter(
    (p) =>
      p.status === "locked" ||
      p.subscription.status === "PAST_DUE" ||
      p.flaggedLabsCount >= 5 ||
      !p.onboardingComplete,
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Population health, growth, and operational signals at a glance."
      >
        <Button variant="outline" asChild>
          <Link href="/analytics">
            View analytics
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/patients">
            <Users className="size-4" />
            All patients
          </Link>
        </Button>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total patients"
          value={stats.total}
          icon={Users}
          delta={12}
          hint="vs last month"
        />
        <StatCard
          index={1}
          label="Monthly recurring revenue"
          value={currency(stats.mrr)}
          icon={CreditCard}
          delta={8}
          hint={`${stats.payingCount} paying`}
          accent="success"
        />
        <StatCard
          index={2}
          label="Avg metabolic score"
          value={stats.avgScore}
          icon={HeartPulse}
          delta={3}
          hint="population mean"
          accent="info"
        />
        <StatCard
          index={3}
          label="Flagged lab markers"
          value={stats.flaggedLabsTotal}
          icon={TriangleAlert}
          hint="needs clinical review"
          accent="warning"
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
              <CardDescription>Patients by subscription tier</CardDescription>
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

      {/* Score distribution + needs attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Metabolic score distribution</CardTitle>
            <CardDescription>Across onboarded patients</CardDescription>
          </CardHeader>
          <CardContent>
            <SingleBarChart
              data={dist}
              xKey="range"
              dataKey="count"
              colorKey="color"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>
                Locked accounts, billing issues, and clinical flags
              </CardDescription>
            </div>
            <TriangleAlert className="size-4 text-warning" />
          </CardHeader>
          <CardContent className="space-y-2">
            {needsAttention.map((p) => {
              const reason = !p.onboardingComplete
                ? "Onboarding incomplete"
                : p.status === "locked"
                  ? "Account locked"
                  : p.subscription.status === "PAST_DUE"
                    ? "Payment past due"
                    : `${p.flaggedLabsCount} flagged lab markers`;
              return (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <PatientAvatar name={p.name} color={p.avatarColor} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {reason}
                    </p>
                  </div>
                  <div className="ml-auto hidden sm:block">
                    <AccountStatusBadge status={p.status} />
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
            <CardTitle>Recently active patients</CardTitle>
            <CardDescription>
              Latest sign-ins and app activity
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patients">
              View all
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Patient</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="pr-5 text-right">Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPatients.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => {
                    window.location.href = `/patients/${p.id}`;
                  }}
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <PatientAvatar name={p.name} color={p.avatarColor} />
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={p.subscription.tier} />
                  </TableCell>
                  <TableCell>
                    <SubStatusBadge status={p.subscription.status} />
                  </TableCell>
                  <TableCell>
                    {p.onboardingComplete ? (
                      <ScoreRing score={p.metabolicScore} size={36} stroke={4} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-5 text-right text-sm text-muted-foreground">
                    {relativeTime(p.lastActivityAt)}
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
