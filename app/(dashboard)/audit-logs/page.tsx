"use client";

import * as React from "react";
import {
  Activity,
  Download,
  Search,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { api, type AuditLogItem } from "@/lib/api";
import { formatDateTime, relativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

const ACTION_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "accent"
> = {
  LOGIN: "success",
  LOGOUT: "secondary",
  LOGIN_FAILED: "warning",
  ADMIN_ACTION: "accent",
  SUBSCRIPTION_CHANGE: "info",
  PASSWORD_RESET: "warning",
  LAB_UPLOAD: "info",
  EMAIL_VERIFIED: "success",
  ACCOUNT_LOCKED: "destructive",
  PROTOCOL_GENERATED: "default",
  UPDATE: "info",
  DELETE: "destructive",
  CREATE: "success",
};

const KNOWN_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "ADMIN_ACTION",
  "SUBSCRIPTION_CHANGE",
  "PASSWORD_RESET",
  "LAB_UPLOAD",
  "EMAIL_VERIFIED",
  "ACCOUNT_LOCKED",
  "PROTOCOL_GENERATED",
  "UPDATE",
  "DELETE",
  "CREATE",
];

function exportCsv(rows: AuditLogItem[]) {
  const headers = ["Timestamp", "User Email", "Action", "Resource Type", "Resource ID", "IP Address", "User Agent"];
  const lines = rows.map((r) => [
    r.createdAt,
    r.userEmail ?? "",
    r.action,
    r.resourceType,
    r.resourceId ?? "",
    r.ip ?? "",
    (r.userAgent ?? "").replace(/,/g, ";"),
  ].map((v) => `"${v}"`).join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogsPage() {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState("all");
  const [userId, setUserId] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [debouncedUserId, setDebouncedUserId] = React.useState("");

  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [failedLoginsTotal, setFailedLoginsTotal] = React.useState<number | null>(null);

  // Debounce userId input so we don't fire on every keystroke
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedUserId(userId), 400);
    return () => clearTimeout(t);
  }, [userId]);

  // Reset to page 1 whenever filters change
  React.useEffect(() => { setPage(1); }, [action, debouncedUserId, from, to]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(action !== "all" ? { action } : {}),
        ...(debouncedUserId ? { userId: debouncedUserId } : {}),
        ...(from ? { from: new Date(from).toISOString() } : {}),
        ...(to ? { to: new Date(to + "T23:59:59").toISOString() } : {}),
      };
      const res = await api.admin.auditLogs.list(params);
      setLogs(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, action, debouncedUserId, from, to]);

  // Stat: failed logins (fetched once on mount)
  React.useEffect(() => {
    api.admin.auditLogs.list({ limit: 1, action: "LOGIN_FAILED" })
      .then((r) => setFailedLoginsTotal(r.total))
      .catch(() => { /* non-critical */ });
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = action !== "all" || userId !== "" || from !== "" || to !== "";

  function clearFilters() {
    setAction("all");
    setUserId("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of authentication, admin, and billing events."
      >
        <Button
          variant="outline"
          onClick={() => {
            if (logs.length === 0) { toast.error("No logs to export"); return; }
            exportCsv(logs);
            toast.success(`Exported ${logs.length} rows`);
          }}
        >
          <Download className="size-4" />
          Export page
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Total events (filtered)"
          value={loading ? "—" : total}
          icon={Activity}
        />
        <StatCard
          index={1}
          label="Admin actions"
          value="—"
          icon={UserCog}
          accent="info"
          hint="Use action filter above"
        />
        <StatCard
          index={2}
          label="Failed logins (all time)"
          value={failedLoginsTotal ?? "—"}
          icon={ShieldCheck}
          accent="warning"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          {/* Row 1: search + action */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by user ID (UUID)…"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="lg:w-52">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {KNOWN_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Row 2: date range */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="from-date" className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
              <Input id="from-date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="to-date" className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
              <Input id="to-date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-px p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon={Activity} title="Failed to load audit logs" className="m-5">
              <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
            </EmptyState>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No events match your filters"
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead className="pr-5">Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-5">
                      <p className="text-sm font-medium">
                        {formatDateTime(l.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(l.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.userEmail ?? (
                        <span className="text-muted-foreground font-mono text-xs">{l.userId ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[l.action] ?? "secondary"}>
                        {l.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{l.resourceType}</span>
                      {l.resourceId && (
                        <p className="font-mono text-xs text-muted-foreground truncate max-w-32">
                          {l.resourceId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.ip ?? "—"}
                    </TableCell>
                    <TableCell className="pr-5 max-w-48 truncate text-xs text-muted-foreground">
                      {l.userAgent ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && !error && total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
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
