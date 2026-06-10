"use client";

import * as React from "react";
import { Activity, MousePointerClick, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DonutChart,
  FunnelBarChart,
  GroupedBarChart,
  MultiLineChart,
  SingleBarChart,
  TrendAreaChart,
} from "@/components/dashboard/charts";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { analyticsOverview, integrationAdoption } from "@/lib/data";
import type { AiUsageBucket } from "@/lib/api";
import {
  api,
  type AnalyticsOverview,
  type GrowthBucket,
  type EngagementBucket,
  type AnalyticsRange,
} from "@/lib/api";
import { currency } from "@/lib/utils";

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "12 months", value: "12m" },
];

function RangeSelect({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (v: AnalyticsRange) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsRange)}>
      <SelectTrigger className="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGES.map((r) => (
          <SelectItem key={r.value} value={r.value} className="text-xs">
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function AnalyticsPage() {
  // ── mock-backed sections ─────────────────────────────────────────────────
  const stats = analyticsOverview();
  const adoption = integrationAdoption();

  const tierColors: Record<string, string> = {
    FREE: "var(--chart-4)",
    PRO: "var(--chart-2)",
    PREMIUM: "var(--chart-1)",
  };

  // ── Step 10: Overview + Revenue ──────────────────────────────────────────
  const [overviewData, setOverviewData] = React.useState<AnalyticsOverview | null>(null);
  React.useEffect(() => {
    api.admin.analytics.overview()
      .then((r) => setOverviewData(r))
      .catch(() => { /* non-critical */ });
  }, []);

  const [revenueRange, setRevenueRange] = React.useState<AnalyticsRange>("30d");
  const [revenueData, setRevenueData] = React.useState<{
    currentMrr: number; currentArr: number; churnRate: number;
    buckets: { date: string; mrr: number }[]; note: string;
  } | null>(null);
  const [revenueLoading, setRevenueLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setRevenueLoading(true);
    api.admin.analytics.revenue(revenueRange)
      .then((r) => { if (!cancelled) { setRevenueData(r.data); setRevenueLoading(false); } })
      .catch(() => { if (!cancelled) { setRevenueLoading(false); } });
    return () => { cancelled = true; };
  }, [revenueRange]);

  const donutData = (overviewData?.tierBreakdown ?? stats.tierBreakdown).map((t) => ({
    name: t.tier,
    value: t.count,
    color: tierColors[t.tier],
  }));

  // ── Step 9: Growth chart ─────────────────────────────────────────────────
  const [growthRange, setGrowthRange] = React.useState<AnalyticsRange>("30d");
  const [growthData, setGrowthData] = React.useState<GrowthBucket[] | null>(null);
  const [growthLoading, setGrowthLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setGrowthLoading(true);
    api.admin.analytics.growth(growthRange)
      .then((r) => { if (!cancelled) { setGrowthData(r.data.buckets); setGrowthLoading(false); } })
      .catch(() => { if (!cancelled) { setGrowthData([]); setGrowthLoading(false); } });
    return () => { cancelled = true; };
  }, [growthRange]);

  // ── Step 9: Engagement chart ─────────────────────────────────────────────
  const [engagementRange, setEngagementRange] = React.useState<AnalyticsRange>("30d");
  const [engagementData, setEngagementData] = React.useState<EngagementBucket[] | null>(null);
  const [engagementLoading, setEngagementLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setEngagementLoading(true);
    api.admin.analytics.engagement(engagementRange)
      .then((r) => { if (!cancelled) { setEngagementData(r.data.buckets); setEngagementLoading(false); } })
      .catch(() => { if (!cancelled) { setEngagementData([]); setEngagementLoading(false); } });
    return () => { cancelled = true; };
  }, [engagementRange]);

  const engagementSeries = [
    { key: "symptoms", color: "var(--chart-1)" },
    { key: "meals", color: "var(--chart-2)" },
    { key: "sleep", color: "var(--chart-3)" },
    { key: "supplements", color: "var(--chart-4)" },
    { key: "medications", color: "var(--chart-5)" },
  ];

  // ── Step 11: AI Usage chart ──────────────────────────────────────────────
  const [aiRange, setAiRange] = React.useState<AnalyticsRange>("30d");
  const [aiData, setAiData] = React.useState<AiUsageBucket[] | null>(null);
  const [aiTracked, setAiTracked] = React.useState<boolean | null>(null);
  const [aiLoading, setAiLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setAiLoading(true);
    api.admin.analytics.aiUsage(aiRange)
      .then((r) => {
        if (!cancelled) {
          setAiData(r.data.buckets);
          setAiTracked(r.data.tracked);
          setAiLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { setAiData([]); setAiTracked(false); setAiLoading(false); } });
    return () => { cancelled = true; };
  }, [aiRange]);

  // ── Step 12: Onboarding funnel ───────────────────────────────────────────
  const [funnelData, setFunnelData] = React.useState<{
    label: string; value: number; pct: number;
  }[] | null>(null);
  const [funnelLoading, setFunnelLoading] = React.useState(true);

  React.useEffect(() => {
    api.admin.analytics.funnel()
      .then((r) => {
        const d = r.data;
        const steps = [
          { label: "Registered", value: d.registered },
          { label: "Email verified", value: d.emailVerified },
          { label: "Survey complete", value: d.surveyComplete },
          { label: "First log", value: d.firstLog },
          { label: "First AI chat", value: d.firstAiChat },
        ];
        const base = d.registered || 1;
        setFunnelData(steps.map((s) => ({ ...s, pct: (s.value / base) * 100 })));
        setFunnelLoading(false);
      })
      .catch(() => { setFunnelData([]); setFunnelLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Growth, revenue, and platform usage across MetaboAI."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Monthly recurring revenue"
          value={revenueData ? currency(revenueData.currentMrr) : "—"}
          icon={Users}
          hint={revenueData ? `ARR ${currency(revenueData.currentArr)}` : "Loading…"}
          accent="success"
        />
        <StatCard
          index={1}
          label="Total users"
          value={overviewData ? overviewData.totalUsers : stats.total}
          icon={UserCheck}
          hint={overviewData ? `${overviewData.activeSubscriptions} active subs` : undefined}
        />
        <StatCard
          index={2}
          label="Activation rate"
          value={`${stats.activationRate}%`}
          icon={Activity}
          delta={4}
          hint="completed onboarding"
          accent="info"
        />
        <StatCard
          index={3}
          label="New signups today"
          value={overviewData ? overviewData.newUsersToday : stats.total}
          icon={MousePointerClick}
          accent="primary"
        />
      </div>

      {/* Growth chart */}
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </div>
          <RangeSelect value={growthRange} onChange={setGrowthRange} />
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : !growthData || growthData.length === 0 ? (
            <EmptyState icon={Users} title="No growth data for this range" className="py-10" />
          ) : (
            <TrendAreaChart
              data={growthData as unknown as Record<string, unknown>[]}
              dataKey="count"
              xKey="date"
              color="var(--chart-1)"
            />
          )}
        </CardContent>
      </Card>

      {/* Engagement chart */}
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Feature engagement</CardTitle>
            <CardDescription>Daily in-app actions across core features</CardDescription>
          </div>
          <RangeSelect value={engagementRange} onChange={setEngagementRange} />
        </CardHeader>
        <CardContent>
          {engagementLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : !engagementData || engagementData.length === 0 ? (
            <EmptyState icon={Activity} title="No engagement data for this range" className="py-10" />
          ) : (
            <>
              <MultiLineChart
                data={engagementData as unknown as Record<string, unknown>[]}
                xKey="date"
                height={300}
                series={engagementSeries}
              />
              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  { label: "Symptoms", color: "var(--chart-1)" },
                  { label: "Meals", color: "var(--chart-2)" },
                  { label: "Sleep", color: "var(--chart-3)" },
                  { label: "Supplements", color: "var(--chart-4)" },
                  { label: "Medications", color: "var(--chart-5)" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Usage chart */}
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>AI usage</CardTitle>
            <CardDescription>AI feature invocations per day</CardDescription>
          </div>
          <RangeSelect value={aiRange} onChange={setAiRange} />
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : aiTracked === false ? (
            <EmptyState
              icon={Activity}
              title="AI usage tracking not yet enabled"
              description="AI audit events are not being recorded for this environment."
              className="py-10"
            />
          ) : !aiData || aiData.length === 0 ? (
            <EmptyState icon={Activity} title="No AI usage data for this range" className="py-10" />
          ) : (
            <>
              <GroupedBarChart
                data={aiData as unknown as Record<string, unknown>[]}
                xKey="date"
                height={300}
                series={[
                  { key: "chat", color: "var(--chart-1)" },
                  { key: "labInterpret", color: "var(--chart-2)" },
                  { key: "nutrition", color: "var(--chart-3)" },
                  { key: "protocol", color: "var(--chart-4)" },
                  { key: "mealPhoto", color: "var(--chart-5)" },
                ]}
              />
              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  { label: "Chat", color: "var(--chart-1)" },
                  { label: "Lab interpret", color: "var(--chart-2)" },
                  { label: "Nutrition", color: "var(--chart-3)" },
                  { label: "Protocol", color: "var(--chart-4)" },
                  { label: "Meal photo", color: "var(--chart-5)" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan mix</CardTitle>
            <CardDescription>Users by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={donutData} />
            <div className="mt-3 space-y-2">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
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

        <Card>
          <CardHeader>
            <CardTitle>Integration adoption</CardTitle>
            <CardDescription>Connected users per integration</CardDescription>
          </CardHeader>
          <CardContent>
            <SingleBarChart
              data={adoption}
              xKey="name"
              dataKey="count"
              color="var(--chart-2)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Revenue trend</CardTitle>
              <CardDescription>MRR over time</CardDescription>
            </div>
            <RangeSelect value={revenueRange} onChange={setRevenueRange} />
          </CardHeader>
          <CardContent>
            {revenueData && (
              <div className="mb-3 flex flex-wrap gap-3 text-xs">
                <span className="rounded-md bg-muted px-2 py-1">
                  MRR <span className="font-semibold text-foreground">{currency(revenueData.currentMrr)}</span>
                </span>
                <span className="rounded-md bg-muted px-2 py-1">
                  ARR <span className="font-semibold text-foreground">{currency(revenueData.currentArr)}</span>
                </span>
                <span className="rounded-md bg-muted px-2 py-1">
                  Churn <span className="font-semibold text-foreground">{revenueData.churnRate.toFixed(1)}%</span>
                </span>
              </div>
            )}
            {revenueLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : !revenueData || revenueData.buckets.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Historical data coming soon"
                description="Revenue time-series requires the billing pipeline to be wired."
                className="py-8"
              />
            ) : (
              <TrendAreaChart
                data={revenueData.buckets as unknown as Record<string, unknown>[]}
                dataKey="mrr"
                xKey="date"
                color="var(--success)"
                height={200}
                formatter={(v) => currency(v)}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Onboarding funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding funnel</CardTitle>
          <CardDescription>
            Lifecycle conversion from registration to first AI chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : !funnelData || funnelData.length === 0 ? (
            <EmptyState icon={Activity} title="No funnel data available" className="py-8" />
          ) : (
            <FunnelBarChart data={funnelData} height={220} color="var(--chart-2)" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
