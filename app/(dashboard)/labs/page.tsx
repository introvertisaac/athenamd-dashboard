"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  FlaskConical,
  Search,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { LabStatusBadge } from "@/components/dashboard/badges";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SingleBarChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PATIENTS_ONLY, getLabs, getPatient, labStatus } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { LabResult } from "@/lib/types";

type Row = LabResult & { patientId: string; patientName: string; patientColor: string };

export default function LabsPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  const allRows: Row[] = React.useMemo(() => {
    return PATIENTS_ONLY.flatMap((p) =>
      getLabs(p.id).map((l) => ({
        ...l,
        patientId: p.id,
        patientName: p.name,
        patientColor: p.avatarColor,
      })),
    );
  }, []);

  const categories = React.useMemo(
    () => Array.from(new Set(allRows.map((r) => r.category))).sort(),
    [allRows],
  );

  const filtered = allRows.filter((r) => {
    if (
      query &&
      !`${r.marker} ${r.patientName}`.toLowerCase().includes(query.toLowerCase())
    )
      return false;
    if (category !== "all" && r.category !== category) return false;
    if (status !== "all" && labStatus(r) !== status) return false;
    return true;
  });

  const flaggedTotal = allRows.filter((r) => labStatus(r) === "out_of_range").length;
  const suboptimalTotal = allRows.filter((r) => labStatus(r) === "suboptimal").length;
  const patientsWithFlags = new Set(
    allRows.filter((r) => labStatus(r) === "out_of_range").map((r) => r.patientId),
  ).size;

  // most-flagged markers
  const markerFlagCount: Record<string, number> = {};
  allRows.forEach((r) => {
    if (labStatus(r) === "out_of_range")
      markerFlagCount[r.marker] = (markerFlagCount[r.marker] ?? 0) + 1;
  });
  const topFlagged = Object.entries(markerFlagCount)
    .map(([marker, count]) => ({ marker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const hasFilters = query || category !== "all" || status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labs"
        description="Every lab marker across the patient population, with functional-range flags."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Markers tracked" value={allRows.length} icon={Activity} />
        <StatCard
          index={1}
          label="Out of range"
          value={flaggedTotal}
          icon={TriangleAlert}
          accent="destructive"
        />
        <StatCard
          index={2}
          label="Suboptimal"
          value={suboptimalTotal}
          icon={FlaskConical}
          accent="warning"
        />
        <StatCard
          index={3}
          label="Patients with flags"
          value={patientsWithFlags}
          icon={Users}
          accent="info"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most-flagged markers</CardTitle>
          <CardDescription>
            Markers most frequently out of conventional range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SingleBarChart
            data={topFlagged}
            xKey="marker"
            dataKey="count"
            color="var(--destructive)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search marker or patient…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="optimal">Optimal</SelectItem>
                <SelectItem value="suboptimal">Suboptimal</SelectItem>
                <SelectItem value="out_of_range">Out of range</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setStatus("all");
                }}
                className="text-muted-foreground"
              >
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No lab markers match your filters"
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Patient</TableHead>
                  <TableHead>Marker</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Functional range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 60).map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/patients/${r.patientId}`)}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <PatientAvatar
                          name={r.patientName}
                          color={r.patientColor}
                          className="size-7 text-[0.65rem]"
                        />
                        <span className="text-sm font-medium">
                          {r.patientName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{r.marker}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.category}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {r.value} {r.unit}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {r.functionalLow} – {r.functionalHigh} {r.unit}
                    </TableCell>
                    <TableCell>
                      <LabStatusBadge status={labStatus(r)} />
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
      {filtered.length > 60 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing first 60 of {filtered.length} markers — refine filters to
          narrow results.
        </p>
      )}
    </div>
  );
}
