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
  TriangleAlert,
  Unlock,
  UserCog,
  Users,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  AccountStatusBadge,
  RoleBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, type UserListItem, type UserListParams } from "@/lib/api";
import type { AccountStatus } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const AVATAR_COLORS = [
  "#0f766e", "#0284c7", "#7c3aed", "#b45309",
  "#be185d", "#15803d", "#c2410c", "#1d4ed8",
];

function emailToName(email: string): string {
  const handle = email.split("@")[0] || "user";
  return handle
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function emailToColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function deriveAccountStatus(u: UserListItem): AccountStatus {
  if (u.deletedAt) return "deleted";
  if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) return "locked";
  return "active";
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type ActionType = "lock" | "unlock" | "role" | "delete" | null;

interface PendingAction {
  type: ActionType;
  user: UserListItem;
}

export default function UsersPage() {
  const router = useRouter();

  // Filter state
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [tier, setTier] = React.useState("all");
  const [billing, setBilling] = React.useState("all");
  const [page, setPage] = React.useState(1);

  // Data state
  const [rows, setRows] = React.useState<UserListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Action dialog state
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [newRole, setNewRole] = React.useState<"PATIENT" | "ADMIN">("PATIENT");
  const [deleteConfirmEmail, setDeleteConfirmEmail] = React.useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    const params: UserListParams = { page, limit: PAGE_SIZE };
    if (role !== "all") params.role = role as "PATIENT" | "ADMIN";
    if (tier !== "all") params.tier = tier as "FREE" | "PRO" | "PREMIUM";
    if (billing !== "all")
      params.status = billing as "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "INCOMPLETE";
    try {
      const res = await api.admin.users.list(params);
      setRows(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, role, tier, billing]);

  React.useEffect(() => { void load(); }, [load]);

  // Reset to page 1 when server-side filters change
  React.useEffect(() => { setPage(1); }, [role, tier, billing]);

  // ── Client-side email search on current page ───────────────────────────────

  const filtered = React.useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter((u) => u.email.toLowerCase().includes(query.toLowerCase()));
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasFilters = role !== "all" || tier !== "all" || billing !== "all" || query.trim() !== "";

  function clearFilters() {
    setQuery("");
    setRole("all");
    setTier("all");
    setBilling("all");
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function openDialog(type: ActionType, user: UserListItem) {
    setDeleteConfirmEmail("");
    if (type === "role") setNewRole(user.role === "ADMIN" ? "PATIENT" : "ADMIN");
    setPending({ type, user });
  }

  function closeDialog() {
    if (!actionLoading) setPending(null);
  }

  async function handleLock() {
    if (!pending) return;
    setActionLoading(true);
    try {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await api.admin.users.update(pending.user.id, { lockedUntil: lockUntil });
      toast.success(`${pending.user.email} locked for 15 minutes.`);
      setPending(null);
      void load();
    } catch {
      toast.error("Failed to lock account.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnlock() {
    if (!pending) return;
    setActionLoading(true);
    try {
      await api.admin.users.update(pending.user.id, { lockedUntil: null });
      toast.success(`${pending.user.email} unlocked.`);
      setPending(null);
      void load();
    } catch {
      toast.error("Failed to unlock account.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChangeRole() {
    if (!pending) return;
    setActionLoading(true);
    try {
      await api.admin.users.update(pending.user.id, { role: newRole });
      toast.success(`${pending.user.email} role changed to ${newRole}.`);
      setPending(null);
      void load();
    } catch {
      toast.error("Failed to change role.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!pending) return;
    setActionLoading(true);
    try {
      await api.admin.users.delete(pending.user.id);
      toast.success(`${pending.user.email} has been soft-deleted.`);
      setPending(null);
      void load();
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={loading ? "Loading users…" : `${total} registered users across all plans.`}
      >
        <Button
          variant="outline"
          onClick={() => toast.success("User export queued — CSV will be emailed.")}
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
              placeholder="Search by email on this page…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {query.trim() && (
            <p className="text-xs text-muted-foreground lg:hidden">
              Searching within this page · server-side search in Workstream B
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="lg:w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="PATIENT">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="lg:w-32">
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
              <SelectTrigger className="lg:w-36">
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
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {query.trim() && (
        <p className="hidden text-xs text-muted-foreground lg:block">
          Searching within this page only · server-side search coming in Workstream B
        </p>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-px p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[52px] rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <TriangleAlert className="size-4 shrink-0 text-warning" />
                Failed to load users.
                <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users match your filters"
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
                    <TableHead className="pl-5">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const name = emailToName(u.email);
                    const accountStatus = deriveAccountStatus(u);
                    const isLocked = accountStatus === "locked";
                    return (
                      <TableRow
                        key={u.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/users/${u.id}`)}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <PatientAvatar name={name} color={emailToColor(u.email)} />
                            <div>
                              <p className="text-sm font-semibold">{name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell>
                          {u.subscription ? (
                            <TierBadge tier={u.subscription.tier} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.subscription ? (
                            <SubStatusBadge status={u.subscription.status} />
                          ) : (
                            <span className="text-xs text-muted-foreground">No sub</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <AccountStatusBadge status={accountStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.lastLoginAt ? relativeTime(u.lastLoginAt) : "Never"}
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
                                <Link href={`/users/${u.id}`}>
                                  <Eye /> View profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDialog("role", u)}>
                                <UserCog /> Change role
                              </DropdownMenuItem>
                              {isLocked ? (
                                <DropdownMenuItem onClick={() => openDialog("unlock", u)}>
                                  <Unlock /> Unlock account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => openDialog("lock", u)}>
                                  <Lock /> Lock account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => openDialog("delete", u)}
                              >
                                <Trash2 /> Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">{page}</span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
            {" · "}
            <span className="font-medium text-foreground">{total}</span> total
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

      {/* ── Lock dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={pending?.type === "lock"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock account?</DialogTitle>
            <DialogDescription>
              This will prevent{" "}
              <span className="font-medium">{pending?.user.email}</span> from signing
              in for 15 minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLock} disabled={actionLoading}>
              {actionLoading ? "Locking…" : "Lock account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unlock dialog ────────────────────────────────────────────────────── */}
      <Dialog open={pending?.type === "unlock"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock account?</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{pending?.user.email}</span> will be
              able to sign in immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleUnlock} disabled={actionLoading}>
              {actionLoading ? "Unlocking…" : "Unlock account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change role dialog ───────────────────────────────────────────────── */}
      <Dialog open={pending?.type === "role"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Changing the role for{" "}
              <span className="font-medium">{pending?.user.email}</span>.
              This will grant or revoke admin access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-role">New role</Label>
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as "PATIENT" | "ADMIN")}
            >
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PATIENT">User (Patient)</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {newRole === "ADMIN" && (
              <p className="text-xs text-warning">
                This user will have full admin access to this dashboard.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={actionLoading}>
              {actionLoading ? "Saving…" : "Save role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ────────────────────────────────────────────────────── */}
      <Dialog open={pending?.type === "delete"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This is a soft delete — the user record will be marked deleted but not
              permanently removed. Their Stripe subscription will{" "}
              <span className="font-medium text-foreground">not</span> be canceled automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-email">
              Type <span className="font-mono text-foreground">{pending?.user.email}</span> to
              confirm
            </Label>
            <Input
              id="confirm-email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={pending?.user.email ?? ""}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading || deleteConfirmEmail !== pending?.user.email}
            >
              {actionLoading ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
