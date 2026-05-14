"use client";

import {
  Activity,
  HeartPulse,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DonutChart,
  GroupedBarChart,
  MultiLineChart,
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
import {
  analyticsOverview,
  engagementSeries,
  scoreDistribution,
  signupSeries,
} from "@/lib/data";
import { currency } from "@/lib/utils";

export default function AnalyticsPage() {
  const stats = analyticsOverview();
  const signups = signupSeries();
  const engagement = engagementSeries();
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Growth, engagement, and population health metrics across MetaboAI."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total patients"
          value={stats.total}
          icon={Users}
          delta={12}
        />
        <StatCard
          index={1}
          label="Active this week"
          value={stats.active}
          icon={UserCheck}
          delta={5}
          accent="success"
        />
        <StatCard
          index={2}
          label="Onboarding rate"
          value={`${stats.onboardingRate}%`}
          icon={Activity}
          delta={4}
          accent="info"
        />
        <StatCard
          index={3}
          label="Avg metabolic score"
          value={stats.avgScore}
          icon={HeartPulse}
          delta={3}
          accent="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New signups</CardTitle>
            <CardDescription>Monthly new patient registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <SingleBarChart
              data={signups}
              xKey="month"
              dataKey="signups"
              color="var(--chart-1)"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active users</CardTitle>
            <CardDescription>Cumulative active patient base</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendAreaChart
              data={signups}
              dataKey="activeUsers"
              xKey="month"
              color="var(--chart-2)"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature engagement</CardTitle>
          <CardDescription>
            Daily logging activity across core features this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupedBarChart
            data={engagement}
            xKey="day"
            height={300}
            series={[
              { key: "foodLogs", color: "var(--chart-1)" },
              { key: "symptomLogs", color: "var(--chart-2)" },
              { key: "coachChats", color: "var(--chart-4)" },
              { key: "labs", color: "var(--chart-5)" },
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-4">
            {[
              { label: "Food logs", color: "var(--chart-1)" },
              { label: "Symptom logs", color: "var(--chart-2)" },
              { label: "Coach chats", color: "var(--chart-4)" },
              { label: "Lab uploads", color: "var(--chart-5)" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan mix</CardTitle>
            <CardDescription>Patients by tier</CardDescription>
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
            <CardTitle>Score distribution</CardTitle>
            <CardDescription>Metabolic scores by band</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>MRR over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              data={signups}
              xKey="month"
              height={220}
              series={[{ key: "mrr", color: "var(--success)" }]}
            />
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Current MRR:{" "}
              <span className="font-semibold text-foreground">
                {currency(stats.mrr)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
