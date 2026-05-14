"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { SubStatusBadge, TierBadge } from "@/components/dashboard/badges";
import { TrendAreaChart } from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  signupSeries,
} from "@/lib/data";
import { currency, formatDate } from "@/lib/utils";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState("all");
  const stats = analyticsOverview();
  const series = signupSeries();

  const rows = PATIENTS_ONLY.filter((p) => {
    if (filter === "all") return true;
    if (filter === "paying")
      return p.subscription.tier !== "FREE" && p.subscription.status === "ACTIVE";
    if (filter === "issues")
      return ["PAST_DUE", "INCOMPLETE"].includes(p.subscription.status);
    return p.subscription.tier === filter;
  }).sort((a, b) => b.subscription.mrr - a.subscription.mrr);

  const tierRevenue = (["PREMIUM", "PRO", "FREE"] as const).map((tier) => {
    const members = PATIENTS_ONLY.filter((p) => p.subscription.tier === tier);
    return {
      tier,
      count: members.length,
      mrr: members.reduce((s, p) => s + p.subscription.mrr, 0),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Billing health, revenue, and Stripe subscription state across all users."
      >
        <Button
          variant="outline"
          onClick={() => toast.success("Opened Stripe dashboard (demo).")}
        >
          <CreditCard className="size-4" />
          Open Stripe
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="MRR"
          value={currency(stats.mrr)}
          icon={DollarSign}
          delta={8}
          hint="vs last month"
          accent="success"
        />
        <StatCard
          index={1}
          label="ARR (projected)"
          value={currency(stats.arr)}
          icon={TrendingUp}
          delta={11}
          accent="primary"
        />
        <StatCard
          index={2}
          label="Paying customers"
          value={stats.payingCount}
          icon={Users}
          delta={6}
          accent="info"
        />
        <StatCard
          index={3}
          label="Churn rate"
          value={`${stats.churnRate}%`}
          icon={ArrowDownRight}
          hint="30-day rolling"
          accent="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recurring revenue</CardTitle>
            <CardDescription>MRR trend over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendAreaChart
              data={series}
              dataKey="mrr"
              xKey="month"
              color="var(--success)"
              formatter={(v) => currency(v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by tier</CardTitle>
            <CardDescription>Monthly contribution per plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tierRevenue.map((t) => (
              <div key={t.tier} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <TierBadge tier={t.tier} />
                  <span className="text-sm font-bold tabular-nums">
                    {currency(t.mrr)}/mo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.count} user{t.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>
              {rows.length} subscription{rows.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subscriptions</SelectItem>
              <SelectItem value="paying">Paying only</SelectItem>
              <SelectItem value="issues">Billing issues</SelectItem>
              <SelectItem value="PREMIUM">Premium</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
              <SelectItem value="FREE">Free</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Stripe customer</TableHead>
                <TableHead>Renews</TableHead>
                <TableHead className="pr-5">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/users/${p.id}`)}
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2.5">
                      <PatientAvatar
                        name={p.name}
                        color={p.avatarColor}
                        className="size-7 text-[0.65rem]"
                      />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
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
                    <div className="flex items-center gap-1.5">
                      <SubStatusBadge status={p.subscription.status} />
                      {p.subscription.cancelAtPeriodEnd && (
                        <span className="text-xs text-warning">· cancelling</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {p.subscription.mrr > 0
                      ? `${currency(p.subscription.mrr)}/mo`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.subscription.stripeCustomerId ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.subscription.currentPeriodEnd
                      ? formatDate(p.subscription.currentPeriodEnd)
                      : "—"}
                  </TableCell>
                  <TableCell className="pr-5 text-muted-foreground">
                    {formatDate(p.subscription.startedAt)}
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
