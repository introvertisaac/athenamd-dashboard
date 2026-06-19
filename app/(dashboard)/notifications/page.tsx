"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Radio,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  api,
  type DeliveryLogItem,
  type DeliveryStatsData,
  type NotificationType,
  type NotificationStatsRange,
  type PreferencesSummaryData,
  type ScheduledResponse,
  type BroadcastBody,
} from "@/lib/api";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const NOTIFICATION_TYPES: NotificationType[] = [
  "INTERACTION_ALERT",
  "LAB_READY",
  "SYMPTOM_FOLLOWUP",
  "DAILY_FOCUS",
  "LOGGING_REMINDER",
  "WEEKLY_REVIEW",
  "SCORE_DROP",
  "SLEEP_TREND",
  "ADHERENCE_DROP",
  "MED_REMINDER",
  "EMERGENCY_ALERT",
  "VITALS_TREND",
  "CONNECT_DEVICE",
];

function typeLabel(t: NotificationType): string {
  return t.toLowerCase().replace(/_/g, " ");
}

const TYPE_BADGE_VARIANT: Record<
  NotificationType,
  "destructive" | "warning" | "info" | "secondary"
> = {
  INTERACTION_ALERT: "destructive",
  EMERGENCY_ALERT: "destructive",
  LAB_READY: "info",
  SYMPTOM_FOLLOWUP: "warning",
  SCORE_DROP: "warning",
  SLEEP_TREND: "warning",
  ADHERENCE_DROP: "warning",
  VITALS_TREND: "warning",
  DAILY_FOCUS: "info",
  LOGGING_REMINDER: "info",
  WEEKLY_REVIEW: "info",
  CONNECT_DEVICE: "info",
  MED_REMINDER: "secondary",
};

const STATS_RANGES: { label: string; value: NotificationStatsRange }[] = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
];

// ─── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({
  stats,
  prefs,
  statsLoading,
  prefsLoading,
  range,
  onRangeChange,
}: {
  stats: DeliveryStatsData | null;
  prefs: PreferencesSummaryData | null;
  statsLoading: boolean;
  prefsLoading: boolean;
  range: NotificationStatsRange;
  onRangeChange: (r: NotificationStatsRange) => void;
}) {
  const failureRatePct =
    stats && isFinite(stats.failureRate)
      ? (stats.failureRate * 100).toFixed(1) + "%"
      : "0%";

  const pushEnabledLabel =
    prefs
      ? `${prefs.pushEnabled} / ${prefs.totalUsers}`
      : "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Delivery stats</p>
        <div className="flex gap-1">
          {STATS_RANGES.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => onRangeChange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label={`Sent (${range})`}
          value={statsLoading ? "—" : (stats?.totalSent ?? 0)}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          index={1}
          label={`Failed (${range})`}
          value={statsLoading ? "—" : (stats?.totalFailed ?? 0)}
          icon={XCircle}
          accent={stats && stats.totalFailed > 0 ? "destructive" : "primary"}
        />
        <StatCard
          index={2}
          label="Failure rate"
          value={statsLoading ? "—" : failureRatePct}
          icon={Activity}
          hint={`over last ${range}`}
          accent={stats && stats.failureRate > 0 ? "warning" : "primary"}
        />
        <StatCard
          index={3}
          label="Push-enabled users"
          value={prefsLoading ? "—" : pushEnabledLabel}
          icon={Bell}
          hint={
            prefs
              ? `${(prefs.pushEnabledRate * 100).toFixed(0)}% of total`
              : undefined
          }
          accent="info"
        />
      </div>
    </div>
  );
}

// ─── Delivery log tab ──────────────────────────────────────────────────────────

function DeliveryLogTab({ prefs }: { prefs: PreferencesSummaryData | null }) {
  void prefs;
  const [page, setPage] = React.useState(1);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [userIdInput, setUserIdInput] = React.useState("");
  const [debouncedUserId, setDebouncedUserId] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [rows, setRows] = React.useState<DeliveryLogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedUserId(userIdInput), 400);
    return () => clearTimeout(t);
  }, [userIdInput]);

  React.useEffect(() => { setPage(1); }, [typeFilter, statusFilter, from, to, debouncedUserId]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(typeFilter !== "all" ? { type: typeFilter as NotificationType } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter as DeliveryLogItem["status"] } : {}),
        ...(debouncedUserId ? { userId: debouncedUserId } : {}),
        ...(from ? { from: new Date(from).toISOString() } : {}),
        ...(to ? { to: new Date(to + "T23:59:59").toISOString() } : {}),
      };
      const res = await api.admin.notifications.deliveryLog(params);
      setRows(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load delivery log");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, debouncedUserId, from, to]);

  React.useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {NOTIFICATION_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs capitalize">
                {typeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
            <SelectItem value="SENT" className="text-xs">Sent</SelectItem>
            <SelectItem value="FAILED" className="text-xs">Failed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>

        <Input
          placeholder="User ID"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          className="h-8 w-48 text-xs"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon={XCircle} title="Failed to load delivery log" className="py-12" />
          ) : rows.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications found" className="py-12" />
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Failure reason</TableHead>
                    <TableHead className="text-xs">Read</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      >
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{relativeTime(row.createdAt)}</span>
                            </TooltipTrigger>
                            <TooltipContent>{formatDateTime(row.createdAt)}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs">
                          {row.userEmail}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={TYPE_BADGE_VARIANT[row.type] ?? "secondary"}
                            className="text-[0.65rem] capitalize"
                          >
                            {typeLabel(row.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {row.title.length > 50 ? row.title.slice(0, 50) + "…" : row.title}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.status === "FAILED" && row.failReason ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dotted">
                                  {row.failReason.length > 40
                                    ? row.failReason.slice(0, 40) + "…"
                                    : row.failReason}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">{row.failReason}</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.readAt ? (
                            <span className="inline-block size-2 rounded-full bg-success" title="Read" />
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {expandedId === row.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/40 px-4 py-3">
                            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Body
                            </p>
                            <p className="text-sm">{row.body}</p>
                            {row.sentAt && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Sent: {formatDateTime(row.sentAt)}
                              </p>
                            )}
                            {row.failedAt && (
                              <p className="mt-1 text-xs text-destructive">
                                Failed: {formatDateTime(row.failedAt)}
                                {row.failReason ? ` — ${row.failReason}` : ""}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="flex items-center px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status badge helper ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DeliveryLogItem["status"] }) {
  const map: Record<
    DeliveryLogItem["status"],
    "success" | "destructive" | "warning" | "info" | "secondary"
  > = {
    SENT: "success",
    READ: "info",
    FAILED: "destructive",
    PENDING: "warning",
    READY: "warning",
    SUPPRESSED: "secondary",
  };
  return (
    <Badge variant={map[status] ?? "secondary"} className="text-[0.65rem]">
      {status}
    </Badge>
  );
}

// ─── Scheduled tab ─────────────────────────────────────────────────────────────

const WORKER_INTERVAL_MS = 30_000;

function ScheduledTab() {
  const [data, setData] = React.useState<ScheduledResponse["data"] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api.admin.notifications.scheduled()
      .then((r) => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <EmptyState icon={Clock} title="Failed to load scheduler status" className="py-12" />;
  }

  const workerLastMs = data.lastWorkerTickAt ? Date.now() - new Date(data.lastWorkerTickAt).getTime() : null;
  const workerStalled = workerLastMs !== null && workerLastMs > WORKER_INTERVAL_MS * 2;

  return (
    <div className="space-y-4">
      {/* Worker status card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Delivery worker</CardTitle>
            <Badge
              variant={workerStalled ? "destructive" : "success"}
              className="text-xs"
            >
              {workerStalled ? "Stalled" : "Running"}
            </Badge>
          </div>
          <CardDescription>Background worker that delivers queued notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Last tick</p>
              <p className="text-sm font-medium">
                {data.lastWorkerTickAt ? relativeTime(data.lastWorkerTickAt) : "Never"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next tick</p>
              <p className="text-sm font-medium">
                {data.nextWorkerTickAt ? relativeTime(data.nextWorkerTickAt) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last delivered</p>
              <p className="text-sm font-medium">{data.lastWorkerDelivered} notifications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active schedules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active schedules</CardTitle>
          <CardDescription>Recurring jobs that enqueue notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.activeSchedules.length === 0 ? (
            <EmptyState icon={Clock} title="No active schedules" className="py-8" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Interval</TableHead>
                  <TableHead className="text-xs">Last run</TableHead>
                  <TableHead className="text-xs">Last enqueued</TableHead>
                  <TableHead className="text-xs">Next tick</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activeSchedules.map((s) => {
                  const overdue =
                    s.nextTickAt !== null && new Date(s.nextTickAt) < new Date();
                  return (
                    <TableRow key={s.name}>
                      <TableCell className="text-xs font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.interval}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.lastRun ? relativeTime(s.lastRun) : "Never"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.lastEnqueued}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.nextTickAt ? relativeTime(s.nextTickAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={overdue ? "warning" : "success"}
                          className="text-[0.65rem]"
                        >
                          {overdue ? "Overdue" : "OK"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Broadcast tab ─────────────────────────────────────────────────────────────

function BroadcastTab({ prefs }: { prefs: PreferencesSummaryData | null }) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [type, setType] = React.useState<NotificationType>("DAILY_FOCUS");
  const [tier, setTier] = React.useState<"all" | "FREE" | "PRO" | "PREMIUM">("all");
  const [role, setRole] = React.useState<"PATIENT" | "ADMIN">("PATIENT");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [rateLimitUntil, setRateLimitUntil] = React.useState<number | null>(null);
  const [countdown, setCountdown] = React.useState(0);

  // Countdown timer
  React.useEffect(() => {
    if (!rateLimitUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) setRateLimitUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  const isRateLimited = rateLimitUntil !== null && rateLimitUntil > Date.now();

  // Estimated recipient count from preferences summary
  const estimatedCount = React.useMemo(() => {
    if (!prefs) return null;
    // For ADMIN role, pushEnabled won't be representative — just return totalUsers
    if (role === "ADMIN") return prefs.totalUsers;
    return prefs.pushEnabled;
  }, [prefs, role]);

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !isRateLimited;

  async function handleSend() {
    setSending(true);
    try {
      const broadcastBody: BroadcastBody = {
        title: title.trim(),
        body: body.trim(),
        type,
        filter: {
          role,
          ...(tier !== "all" ? { tier } : {}),
        },
      };
      const res = await api.admin.notifications.broadcast(broadcastBody);
      toast.success(`Broadcast enqueued for ${res.data.enqueuedCount} users`);
      setTitle("");
      setBody("");
      setType("DAILY_FOCUS");
      setTier("all");
      setRole("PATIENT");
      setRateLimitUntil(Date.now() + 5 * 60 * 1000);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        toast.error("Rate limited — you can broadcast once every 5 minutes");
        setRateLimitUntil(Date.now() + 5 * 60 * 1000);
      } else {
        const message = err instanceof Error ? err.message : "Broadcast failed";
        toast.error(message);
      }
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  }

  function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send broadcast notification</CardTitle>
          <CardDescription>
            Delivered to users matching the selected filters who have push notifications enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="bc-title">Title</Label>
            <Input
              id="bc-title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bc-body">Body</Label>
              <span className={cn("text-xs", body.length > 900 ? "text-destructive" : "text-muted-foreground")}>
                {body.length} / 1000
              </span>
            </div>
            <textarea
              id="bc-body"
              placeholder="Notification body text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {typeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Filter by tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as typeof tier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tiers</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Filter by role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "PATIENT" | "ADMIN")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">Patients</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview count */}
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {prefs ? (
              <>
                Estimated recipients:{" "}
                <span className="font-semibold text-foreground">
                  ~{estimatedCount ?? "—"}
                </span>
                {tier !== "all" && " (actual count may differ based on tier and push preferences)"}
              </>
            ) : (
              "Loading recipient estimate…"
            )}
          </div>

          {/* Send button */}
          {isRateLimited ? (
            <Button disabled className="w-full">
              <Clock className="mr-2 size-4" />
              Rate limited — {formatCountdown(countdown)}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!canSend}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="mr-2 size-4" />
              Send broadcast
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm broadcast</DialogTitle>
            <DialogDescription>
              This will send a notification to approximately{" "}
              <strong>{estimatedCount ?? "—"}</strong> users. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Title:</span> {title}</p>
            <p><span className="text-muted-foreground">Type:</span> {typeLabel(type)}</p>
            <p>
              <span className="text-muted-foreground">Audience:</span>{" "}
              {role === "PATIENT" ? "Patients" : "Admins"}
              {tier !== "all" ? ` on ${tier} tier` : ""}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={() => void handleSend()} disabled={sending}>
              {sending ? "Sending…" : "Confirm send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [statsRange, setStatsRange] = React.useState<NotificationStatsRange>("24h");
  const [stats, setStats] = React.useState<DeliveryStatsData | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [prefs, setPrefs] = React.useState<PreferencesSummaryData | null>(null);
  const [prefsLoading, setPrefsLoading] = React.useState(true);

  // Fetch preferences once on mount
  React.useEffect(() => {
    api.admin.notifications.preferencesSummary()
      .then((r) => setPrefs(r.data))
      .catch(() => { /* non-critical */ })
      .finally(() => setPrefsLoading(false));
  }, []);

  // Fetch stats whenever range changes
  React.useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    api.admin.notifications.deliveryStats(statsRange)
      .then((r) => { if (!cancelled) setStats(r.data); })
      .catch(() => { /* non-critical */ })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [statsRange]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Delivery log, scheduler status, and broadcast management."
      />

      <StatsRow
        stats={stats}
        prefs={prefs}
        statsLoading={statsLoading}
        prefsLoading={prefsLoading}
        range={statsRange}
        onRangeChange={setStatsRange}
      />

      <Tabs defaultValue="delivery-log">
        <TabsList>
          <TabsTrigger value="delivery-log">
            <Bell className="mr-1.5 size-3.5" />
            Delivery log
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="mr-1.5 size-3.5" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Radio className="mr-1.5 size-3.5" />
            Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delivery-log" className="mt-4">
          <DeliveryLogTab prefs={prefs} />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <ScheduledTab />
        </TabsContent>
        <TabsContent value="broadcast" className="mt-4">
          <BroadcastTab prefs={prefs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
