"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  FlaskConical,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type AdminFlaggedLabItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function LabsPage() {
  const [marker, setMarker] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [debouncedMarker, setDebouncedMarker] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [labs, setLabs] = React.useState<AdminFlaggedLabItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedMarker(marker), 400);
    return () => clearTimeout(t);
  }, [marker]);

  React.useEffect(() => { setPage(1); }, [debouncedMarker, from, to]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.admin.labs.flaggedList({
        page,
        limit: PAGE_SIZE,
        ...(debouncedMarker ? { marker: debouncedMarker } : {}),
        ...(from ? { from: new Date(from).toISOString() } : {}),
        ...(to ? { to: new Date(to + "T23:59:59").toISOString() } : {}),
      });
      setLabs(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load flagged labs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedMarker, from, to]);

  React.useEffect(() => { void load(); }, [load]);

  const uniquePatients = React.useMemo(
    () => new Set(labs.map((r) => r.userId)).size,
    [labs],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = marker !== "" || from !== "" || to !== "";

  function clearFilters() {
    setMarker("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flagged Labs"
        description="Lab results flagged as out of range across the user population."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          index={0}
          label="Flagged markers (total)"
          value={loading ? "—" : total}
          icon={Activity}
        />
        <StatCard
          index={1}
          label="Out of range"
          value={loading ? "—" : total}
          icon={TriangleAlert}
          accent="destructive"
        />
        <StatCard
          index={2}
          label="Unique patients (page)"
          value={loading ? "—" : uniquePatients}
          icon={Users}
          accent="info"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <FlaskConical className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by marker name (exact match)…"
                value={marker}
                onChange={(e) => setMarker(e.target.value)}
                className="pl-9"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="labs-from" className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
              <Input id="labs-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="labs-to" className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
              <Input id="labs-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
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
            <EmptyState icon={FlaskConical} title="Failed to load flagged labs" className="m-5">
              <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
            </EmptyState>
          ) : labs.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No flagged labs match your filters"
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Marker</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Reference range</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead className="pr-5">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 text-sm">
                      <Link
                        href={`/users/${r.userId}`}
                        className="font-medium hover:underline"
                      >
                        {r.userEmail}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{r.markerName}</TableCell>
                    <TableCell className="font-semibold tabular-nums text-destructive">
                      {r.value}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {r.referenceRange ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.labName ?? "—"}
                    </TableCell>
                    <TableCell className="pr-5 text-muted-foreground">
                      {formatDate(r.collectedDate)}
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
