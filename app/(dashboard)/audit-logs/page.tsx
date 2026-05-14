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
import { RoleBadge } from "@/components/dashboard/badges";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { AUDIT_LOGS } from "@/lib/data";
import { formatDateTime, relativeTime } from "@/lib/utils";

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
};

export default function AuditLogsPage() {
  const [query, setQuery] = React.useState("");
  const [action, setAction] = React.useState("all");
  const [role, setRole] = React.useState("all");

  const actions = React.useMemo(
    () => Array.from(new Set(AUDIT_LOGS.map((l) => l.action))).sort(),
    [],
  );

  const filtered = AUDIT_LOGS.filter((l) => {
    if (
      query &&
      !`${l.actorEmail} ${l.action} ${l.ipAddress} ${l.resourceType}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;
    if (action !== "all" && l.action !== action) return false;
    if (role !== "all" && l.actorRole !== role) return false;
    return true;
  });

  const adminActions = AUDIT_LOGS.filter((l) => l.actorRole === "ADMIN").length;
  const failedLogins = AUDIT_LOGS.filter(
    (l) => l.action === "LOGIN_FAILED",
  ).length;

  const hasFilters = query || action !== "all" || role !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of authentication, admin, and billing events."
      >
        <Button
          variant="outline"
          onClick={() => toast.success("Audit log export queued (demo).")}
        >
          <Download className="size-4" />
          Export
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Events (last 7 days)"
          value={AUDIT_LOGS.length}
          icon={Activity}
        />
        <StatCard
          index={1}
          label="Admin actions"
          value={adminActions}
          icon={UserCog}
          accent="info"
        />
        <StatCard
          index={2}
          label="Failed logins"
          value={failedLogins}
          icon={ShieldCheck}
          accent="warning"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by actor, action, IP, or resource…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="lg:w-52">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="lg:w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PATIENT">Patient</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setAction("all");
                  setRole("all");
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
              icon={Activity}
              title="No events match your filters"
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead className="pr-5">Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-5">
                      <p className="text-sm font-medium">
                        {formatDateTime(l.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(l.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{l.actorEmail}</TableCell>
                    <TableCell>
                      <RoleBadge role={l.actorRole} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[l.action] ?? "secondary"}>
                        {l.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {l.resourceType}
                      </span>
                      {l.resourceId && (
                        <p className="font-mono text-xs text-muted-foreground">
                          {l.resourceId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.ipAddress}
                    </TableCell>
                    <TableCell className="pr-5 max-w-48 truncate text-xs text-muted-foreground">
                      {l.userAgent}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
