"use client";

import { Activity, MousePointerClick, UserCheck, Users } from "lucide-react";
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
  integrationAdoption,
  signupSeries,
  usageSeries,
} from "@/lib/data";
import { currency } from "@/lib/utils";

export default function AnalyticsPage() {
  const stats = analyticsOverview();
  const signups = signupSeries();
  const engagement = engagementSeries();
  const usage = usageSeries();
  const adoption = integrationAdoption();

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
        description="Growth, revenue, and platform usage across MetaboAI."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total users"
          value={stats.total}
          icon={Users}
          delta={12}
        />
        <StatCard
          index={1}
          label="Weekly active users"
          value={stats.wau}
          icon={UserCheck}
          delta={5}
          hint={`${stats.dau} active today`}
          accent="success"
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
          label="Avg actions / user"
          value={stats.avgActionsPerUser}
          icon={MousePointerClick}
          delta={9}
          hint="trailing 30 days"
          accent="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New signups</CardTitle>
            <CardDescription>Monthly new user registrations</CardDescription>
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
            <CardDescription>Cumulative active user base</CardDescription>
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
            Daily in-app actions across core features this week
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

      <Card>
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
            height={280}
            series={[
              { key: "activeUsers", color: "var(--chart-1)" },
              { key: "sessions", color: "var(--chart-4)" },
            ]}
          />
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
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <span className="text-muted-foreground">
                MRR{" "}
                <span className="font-semibold text-foreground">
                  {currency(stats.mrr)}
                </span>
              </span>
              <span className="text-muted-foreground">
                ARPU{" "}
                <span className="font-semibold text-foreground">
                  {currency(stats.arpu)}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
