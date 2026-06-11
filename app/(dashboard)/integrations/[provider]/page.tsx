"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Cable } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  api,
  type AdminIntegrationUser,
  type AdminIntegrationsByProviderParams,
} from "@/lib/api";
import { formatDate, relativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

const KNOWN_PROVIDERS = new Set([
  "APPLE_HEALTH",
  "GOOGLE_HEALTH_CONNECT",
  "OURA",
  "GARMIN",
  "WHOOP",
  "LABCORP",
  "QUEST",
]);

const PROVIDER_NAME: Record<string, string> = {
  APPLE_HEALTH: "Apple Health",
  GOOGLE_HEALTH_CONNECT: "Google Health Connect",
  OURA: "Oura Ring",
  GARMIN: "Garmin",
  WHOOP: "WHOOP",
  LABCORP: "LabCorp",
  QUEST: "Quest Diagnostics",
};

type StatusFilter = "all" | AdminIntegrationUser["status"];

const STATUS_BADGE_VARIANT: Record<
  AdminIntegrationUser["status"],
  "success" | "destructive" | "warning" | "secondary"
> = {
  CONNECTED: "success",
  ERROR: "destructive",
  PENDING: "warning",
  DISCONNECTED: "secondary",
};

export default function IntegrationProviderPage() {
  const { provider } = useParams<{ provider: string }>();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [page, setPage] = React.useState(1);

  const [users, setUsers] = React.useState<AdminIntegrationUser[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const isValidProvider = KNOWN_PROVIDERS.has(provider);
  const providerName =
    PROVIDER_NAME[provider] ??
    provider.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  React.useEffect(() => { setPage(1); }, [statusFilter]);

  const load = React.useCallback(async () => {
    if (!isValidProvider) return;
    setLoading(true);
    setError(false);
    try {
      const params: AdminIntegrationsByProviderParams = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.admin.integrations.listByProvider(provider, params);
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [provider, page, statusFilter, isValidProvider]);

  React.useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const backLink = (
    <Link
      href="/integrations"
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to integrations
    </Link>
  );

  if (!isValidProvider) {
    return (
      <div className="space-y-6">
        <PageHeader title="Unknown provider" description="">
          {backLink}
        </PageHeader>
        <EmptyState icon={Cable} title="Unknown provider" description={`"${provider}" is not a recognised integration provider.`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={providerName}
        description={`All patients connected via ${providerName}.`}
      >
        {backLink}
      </PageHeader>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="CONNECTED">Connected</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-px p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon={Cable} title="Failed to load integrations" className="m-5">
              <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
            </EmptyState>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Cable}
              title="No connections match the current filter"
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead>Last synced</TableHead>
                  <TableHead className="pr-5">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-5 text-sm">
                      <Link href={`/users/${u.userId}`} className="font-medium hover:underline">
                        {u.userEmail}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[u.status]}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.connectedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastSyncedAt ? relativeTime(u.lastSyncedAt) : "—"}
                    </TableCell>
                    <TableCell className="pr-5 max-w-64 truncate text-xs text-muted-foreground">
                      {u.status === "ERROR" ? (u.errorMessage ?? "Unknown error") : "—"}
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
