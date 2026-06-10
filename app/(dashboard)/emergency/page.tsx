"use client";

import * as React from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  type EmergencyEvent,
  type EmergencyEventStatus,
} from "@/lib/api";
import { relativeTime, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 25;

type PendingAction = { eventId: string; action: "acknowledge" | "dismiss"; userEmail?: string };

const STATUS_VARIANT: Record<
  EmergencyEventStatus,
  "default" | "secondary" | "warning" | "destructive" | "success"
> = {
  DETECTED: "destructive",
  ACKNOWLEDGED: "warning",
  DISMISSED: "secondary",
};

const TYPE_VARIANT: Record<string, "default" | "info" | "warning" | "destructive"> = {
  ABNORMAL_VITALS: "destructive",
  MEDICATION_CONFLICT: "warning",
  LAB_CRITICAL: "destructive",
  MISSED_DOSE: "warning",
  INACTIVITY: "info",
};

export default function EmergencyPage() {
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<"all" | EmergencyEventStatus>("all");

  const [events, setEvents] = React.useState<EmergencyEvent[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [detectedTotal, setDetectedTotal] = React.useState<number | null>(null);

  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [actioning, setActioning] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      };
      const res = await api.admin.emergency.list(params);
      setEvents(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load emergency events");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  React.useEffect(() => { setPage(1); }, [statusFilter]);

  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    api.admin.emergency.list({ limit: 1, status: "DETECTED" })
      .then((r) => setDetectedTotal(r.total))
      .catch(() => { /* non-critical */ });
  }, []);

  async function handleConfirm() {
    if (!pending) return;
    setActioning(true);
    try {
      if (pending.action === "acknowledge") {
        await api.admin.emergency.acknowledge(pending.eventId);
        toast.success("Event acknowledged");
      } else {
        await api.admin.emergency.dismiss(pending.eventId);
        toast.success("Event dismissed");
      }
      setPending(null);
      void load();
      // refresh detected count
      api.admin.emergency.list({ limit: 1, status: "DETECTED" })
        .then((r) => setDetectedTotal(r.total))
        .catch(() => { /* non-critical */ });
    } catch {
      toast.error(`Failed to ${pending.action} event`);
    } finally {
      setActioning(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Events"
        description="Cross-patient critical health alerts requiring admin review."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Active alerts (detected)"
          value={detectedTotal ?? "—"}
          icon={AlertTriangle}
          accent="destructive"
        />
        <StatCard
          index={1}
          label="Total events (filtered)"
          value={loading ? "—" : total}
          icon={ShieldAlert}
        />
        <StatCard
          index={2}
          label="Dismissed"
          value="—"
          icon={ShieldCheck}
          accent="success"
          hint="Use status filter"
        />
      </div>

      <Card>
        <CardContent className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DETECTED">Detected</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-px p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon={ShieldAlert} title="Failed to load events" className="m-5">
              <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
            </EmptyState>
          ) : events.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No emergency events"
              description={statusFilter !== "all" ? "Try a different status filter." : "All clear — no events recorded yet."}
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Detected</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="pl-5">
                      <p className="text-sm font-medium">{relativeTime(ev.detectedAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(ev.detectedAt)}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ev.userEmail ?? (
                        <span className="font-mono text-xs text-muted-foreground">{ev.userId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_VARIANT[ev.type] ?? "secondary"}>
                        {ev.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ev.value != null ? (
                        <span>{ev.value}{ev.unit ? ` ${ev.unit}` : ""}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ev.source ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[ev.status]}>
                        {ev.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ev.status === "DETECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPending({ eventId: ev.id, action: "acknowledge", userEmail: ev.userEmail })}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {(ev.status === "DETECTED" || ev.status === "ACKNOWLEDGED") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => setPending({ eventId: ev.id, action: "dismiss", userEmail: ev.userEmail })}
                          >
                            Dismiss
                          </Button>
                        )}
                        {ev.status === "DISMISSED" && (
                          <span className="text-xs text-muted-foreground">No actions</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && !error && total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={!!pending} onOpenChange={(open) => { if (!open && !actioning) setPending(null); }}>
        <DialogContent showCloseButton={!actioning}>
          <DialogHeader>
            <DialogTitle>
              {pending?.action === "acknowledge" ? "Acknowledge event" : "Dismiss event"}
            </DialogTitle>
            <DialogDescription>
              {pending?.action === "acknowledge"
                ? `Mark this event as acknowledged. It will remain visible but removed from the active alert count.`
                : `Dismiss this event. This is a terminal action — the event cannot be re-opened.`}
              {pending?.userEmail && (
                <span className="mt-1 block font-medium text-foreground">
                  Patient: {pending.userEmail}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={!actioning}>
            <Button
              variant={pending?.action === "dismiss" ? "destructive" : "default"}
              disabled={actioning}
              onClick={() => void handleConfirm()}
            >
              {actioning
                ? "Processing…"
                : pending?.action === "acknowledge"
                ? "Acknowledge"
                : "Dismiss"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
