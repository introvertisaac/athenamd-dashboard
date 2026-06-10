"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { SubStatusBadge, TierBadge } from "@/components/dashboard/badges";
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
  api,
  type AnalyticsOverview,
  type BillingListItem,
  type PaginatedResponse,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const AVATAR_COLORS = [
  "#0f766e", "#0284c7", "#7c3aed", "#b45309",
  "#be185d", "#15803d", "#c2410c", "#1d4ed8",
];

function emailToName(email: string | null | undefined): string {
  if (!email) return "Unknown User";
  const handle = email.split("@")[0] || "user";
  return handle
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function emailToColor(email: string | null | undefined): string {
  if (!email) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const router = useRouter();

  const [filter, setFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const [analytics, setAnalytics] = React.useState<AnalyticsOverview | null>(null);
  const [billingRes, setBillingRes] = React.useState<PaginatedResponse<BillingListItem> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [analyticsData, billingData] = await Promise.all([
        api.admin.analytics.overview(),
        api.admin.billing.list({ page, limit: PAGE_SIZE }),
      ]);
      setAnalytics(analyticsData);
      setBillingRes(billingData);
    } catch {
      setError(true);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => { setPage(1); }, [filter]);

  // ── Computed stats ─────────────────────────────────────────────────────────

  const tierBreakdown = analytics?.tierBreakdown ?? [];
  const payingCount = tierBreakdown
    .filter((t) => t.tier !== "FREE")
    .reduce((s, t) => s + t.count, 0);
  const freeCount = tierBreakdown.find((t) => t.tier === "FREE")?.count ?? 0;

  // ── Client-side filter on current page ────────────────────────────────────

  const allRows = billingRes?.data ?? [];
  const filteredRows = React.useMemo(() => {
    return allRows.filter((r) => {
      if (filter === "all") return true;
      if (filter === "paying") return r.tier !== "FREE" && r.status === "ACTIVE";
      if (filter === "issues") return r.status === "PAST_DUE" || r.status === "INCOMPLETE";
      if (filter === "cancelling") return r.cancelAtPeriodEnd;
      return r.tier === filter;
    });
  }, [allRows, filter]);

  const pastDueCount = allRows.filter((r) => r.status === "PAST_DUE").length;
  const totalPages = Math.max(1, Math.ceil((billingRes?.total ?? 0) / PAGE_SIZE));

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

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[106px] rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <TriangleAlert className="size-4 shrink-0 text-warning" />
          Failed to load data.
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            label="MRR"
            value="—"
            icon={DollarSign}
            hint="Requires Stripe price data"
            accent="success"
          />
          <StatCard
            index={1}
            label="ARR (projected)"
            value="—"
            icon={TrendingUp}
            hint="Requires Stripe price data"
            accent="primary"
          />
          <StatCard
            index={2}
            label="Paying customers"
            value={payingCount}
            icon={Users}
            hint={`${freeCount} on free plan`}
            accent="info"
          />
          <StatCard
            index={3}
            label="Churn rate"
            value="—"
            icon={ArrowDownRight}
            hint="Coming in Workstream B"
            accent="warning"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recurring revenue</CardTitle>
            <CardDescription>MRR trend over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Clock}
              title="Revenue trend coming in Workstream B"
              description="Time-series revenue data requires backend endpoints that are not yet available."
              className="py-8"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscribers by tier</CardTitle>
            <CardDescription>User count per plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)
            ) : tierBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available.</p>
            ) : (
              (["PREMIUM", "PRO", "FREE"] as const).map((tier) => {
                const entry = tierBreakdown.find((t) => t.tier === tier);
                const count = entry?.count ?? 0;
                return (
                  <div key={tier} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <TierBadge tier={tier} />
                      <span className="text-sm font-bold tabular-nums">
                        {count} user{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>
              {loading
                ? "Loading…"
                : `${billingRes?.total ?? 0} subscription${(billingRes?.total ?? 0) !== 1 ? "s" : ""}`}
              {pastDueCount > 0 && (
                <span className="ml-2 text-warning">· {pastDueCount} past due on this page</span>
              )}
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
              <SelectItem value="cancelling">Cancelling</SelectItem>
              <SelectItem value="PREMIUM">Premium</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
              <SelectItem value="FREE">Free</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-px px-5 pb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[52px] rounded-lg" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No subscriptions match this filter"
              description="Try selecting a different filter above."
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe customer</TableHead>
                  <TableHead>Renews</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => {
                  const name = emailToName(r.email);
                  return (
                    <TableRow
                      key={r.userId}
                      className="cursor-pointer"
                      onClick={() => router.push(`/users/${r.userId}`)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <PatientAvatar
                            name={name}
                            color={emailToColor(r.email)}
                            className="size-7 text-[0.65rem]"
                          />
                          <div>
                            <p className="text-sm font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TierBadge tier={r.tier} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <SubStatusBadge status={r.status} />
                          {r.cancelAtPeriodEnd && (
                            <span className="text-xs text-warning">· cancelling</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.stripeCustomerId ? (
                          <span
                            className="cursor-pointer hover:text-foreground"
                            title={r.stripeCustomerId}
                            onClick={() => {
                              void navigator.clipboard.writeText(r.stripeCustomerId!);
                              toast.success("Copied Stripe customer ID");
                            }}
                          >
                            {r.stripeCustomerId.slice(0, 14)}…
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.currentPeriodEnd ? formatDate(r.currentPeriodEnd) : "—"}
                      </TableCell>
                      <TableCell
                        className="pr-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.stripeCustomerId ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={`https://dashboard.stripe.com/customers/${r.stripeCustomerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-3.5" />
                              Stripe
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && !error && (billingRes?.total ?? 0) > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">{page}</span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
            {" · "}
            <span className="font-medium text-foreground">{billingRes?.total ?? 0}</span> total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
