"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  Lock,
  MoreHorizontal,
  Search,
  Trash2,
  Unlock,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  AccountStatusBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATIENTS_ONLY, integrationName } from "@/lib/data";
import { relativeTime } from "@/lib/utils";

const PAGE_SIZE = 8;

export default function PatientsPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [tier, setTier] = React.useState("all");
  const [billing, setBilling] = React.useState("all");
  const [account, setAccount] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    return PATIENTS_ONLY.filter((p) => {
      if (
        query &&
        !`${p.name} ${p.email} ${p.location}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      if (tier !== "all" && p.subscription.tier !== tier) return false;
      if (billing !== "all" && p.subscription.status !== billing) return false;
      if (account !== "all" && p.status !== account) return false;
      return true;
    });
  }, [query, tier, billing, account]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  React.useEffect(() => setPage(1), [query, tier, billing, account]);

  const hasFilters =
    query || tier !== "all" || billing !== "all" || account !== "all";

  function clearFilters() {
    setQuery("");
    setTier("all");
    setBilling("all");
    setAccount("all");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description={`${PATIENTS_ONLY.length} patients across all plans and regions.`}
      >
        <Button
          variant="outline"
          onClick={() => toast.success("Patient export queued — CSV will be emailed.")}
        >
          <Download className="size-4" />
          Export
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="lg:w-36">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={billing} onValueChange={setBilling}>
              <SelectTrigger className="lg:w-40">
                <SelectValue placeholder="Billing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All billing</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIALING">Trialing</SelectItem>
                <SelectItem value="PAST_DUE">Past due</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
                <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="lg:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No patients match your filters"
                description="Try adjusting or clearing the filters above."
                className="m-5"
              >
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Patient</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Integrations</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/patients/${p.id}`)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <PatientAvatar
                            name={p.name}
                            color={p.avatarColor}
                          />
                          <div>
                            <p className="text-sm font-semibold">{p.name}</p>
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
                        <SubStatusBadge status={p.subscription.status} />
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>
                        {p.onboardingComplete ? (
                          <ScoreRing
                            score={p.metabolicScore}
                            size={34}
                            stroke={4}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.flaggedLabsCount > 0 ? (
                          <span className="text-sm font-semibold text-destructive">
                            {p.flaggedLabsCount}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            0
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.connectedIntegrations.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          ) : (
                            p.connectedIntegrations.map((id) => (
                              <span
                                key={id}
                                className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground"
                              >
                                {integrationName(id)}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.lastLoginAt
                          ? relativeTime(p.lastLoginAt)
                          : "Never"}
                      </TableCell>
                      <TableCell
                        className="pr-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/patients/${p.id}`}>
                                <Eye /> View profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.success(`Role editor opened for ${p.name}.`)
                              }
                            >
                              <UserCog /> Change role
                            </DropdownMenuItem>
                            {p.status === "locked" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.success(`${p.name}'s account unlocked.`)
                                }
                              >
                                <Unlock /> Unlock account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.success(`${p.name}'s account locked.`)
                                }
                              >
                                <Lock /> Lock account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                toast.error(
                                  `${p.name} would be soft-deleted (demo).`,
                                )
                              }
                            >
                              <Trash2 /> Delete patient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(current - 1) * PAGE_SIZE + 1}–
              {Math.min(current * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {current} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current === totalPages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
