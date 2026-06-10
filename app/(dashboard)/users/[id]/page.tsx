"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Bot,
  Calendar,
  Cable,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  FlaskConical,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  Unlock,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  AccountStatusBadge,
  RoleBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  type UserDetail,
  type MedicalHistoryResponse,
  type TrackingResponse,
  type LabResultItem,
  type DocumentItem,
  type UserIntegration,
} from "@/lib/api";
import { ScoreRing } from "@/components/dashboard/score-ring";
import type { AccountStatus } from "@/lib/types";
import { cn, formatDate, formatDateTime, relativeTime } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function deriveAccountStatus(u: UserDetail): AccountStatus {
  if (u.deletedAt) return "deleted";
  if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) return "locked";
  return "active";
}

function profileDisplayName(u: UserDetail): string {
  const p = u.profile;
  if (!p) return emailToName(u.email);
  const first = typeof p.firstName === "string" ? p.firstName : "";
  const last = typeof p.lastName === "string" ? p.lastName : "";
  return (first + " " + last).trim() || emailToName(u.email);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type ActionType = "lock" | "unlock" | "role" | "delete" | null;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { clinicalAccess } = useAuth();

  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  const [action, setAction] = React.useState<ActionType>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [newRole, setNewRole] = React.useState<"PATIENT" | "ADMIN">("PATIENT");
  const [deleteConfirmEmail, setDeleteConfirmEmail] = React.useState("");

  // ── Clinical tab state ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState("overview");

  const [medHistory, setMedHistory] = React.useState<MedicalHistoryResponse["data"] | null>(null);
  const [medHistoryLoading, setMedHistoryLoading] = React.useState(false);
  const [medHistoryError, setMedHistoryError] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "health" || medHistory !== null || medHistoryLoading || !user) return;
    setMedHistoryLoading(true);
    setMedHistoryError(false);
    api.admin.users.getMedicalHistory(user.id)
      .then((res) => setMedHistory(res.data))
      .catch(() => setMedHistoryError(true))
      .finally(() => setMedHistoryLoading(false));
  }, [activeTab, medHistory, medHistoryLoading, user]);

  const [docs, setDocs] = React.useState<DocumentItem[] | null>(null);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "documents" || docs !== null || docsLoading || !user) return;
    setDocsLoading(true);
    setDocsError(false);
    api.admin.users.getDocuments(user.id)
      .then((res) => setDocs(res.data))
      .catch(() => setDocsError(true))
      .finally(() => setDocsLoading(false));
  }, [activeTab, docs, docsLoading, user]);

  const [userIntegrations, setUserIntegrations] = React.useState<UserIntegration[] | null>(null);
  const [userIntegrationsLoading, setUserIntegrationsLoading] = React.useState(false);
  const [userIntegrationsError, setUserIntegrationsError] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "user-integrations" || userIntegrations !== null || userIntegrationsLoading || !user) return;
    setUserIntegrationsLoading(true);
    setUserIntegrationsError(false);
    api.admin.users.getIntegrations(user.id)
      .then((res) => setUserIntegrations(res.data))
      .catch(() => setUserIntegrationsError(true))
      .finally(() => setUserIntegrationsLoading(false));
  }, [activeTab, userIntegrations, userIntegrationsLoading, user]);

  const [labs, setLabs] = React.useState<LabResultItem[] | null>(null);
  const [labsLoading, setLabsLoading] = React.useState(false);
  const [labsError, setLabsError] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "labs" || labs !== null || labsLoading || !user) return;
    setLabsLoading(true);
    setLabsError(false);
    api.admin.users.getLabs(user.id, { limit: 200 })
      .then((res) => setLabs(res.data))
      .catch(() => setLabsError(true))
      .finally(() => setLabsLoading(false));
  }, [activeTab, labs, labsLoading, user]);

  const [tracking, setTracking] = React.useState<TrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = React.useState(false);
  const [trackingError, setTrackingError] = React.useState(false);

  React.useEffect(() => {
    if (activeTab !== "tracking" || tracking !== null || trackingLoading || !user) return;
    setTrackingLoading(true);
    setTrackingError(false);
    api.admin.users.getTracking(user.id)
      .then((res) => setTracking(res))
      .catch(() => setTrackingError(true))
      .finally(() => setTrackingLoading(false));
  }, [activeTab, tracking, trackingLoading, user]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.admin.users.get(params.id);
      setUser(res);
    } catch (err: unknown) {
      if (err instanceof Error && "status" in err && (err as { status?: number }).status === 404) {
        setNotFound(true);
      } else {
        toast.error("Failed to load user");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => { void load(); }, [load]);

  function openAction(type: ActionType) {
    if (!user) return;
    setDeleteConfirmEmail("");
    if (type === "role") setNewRole(user.role === "ADMIN" ? "PATIENT" : "ADMIN");
    setAction(type);
  }

  function closeAction() {
    if (!actionLoading) setAction(null);
  }

  async function handleLock() {
    if (!user) return;
    setActionLoading(true);
    try {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await api.admin.users.update(user.id, { lockedUntil: lockUntil });
      toast.success(`${user.email} locked for 15 minutes.`);
      setAction(null);
      void load();
    } catch { toast.error("Failed to lock account."); }
    finally { setActionLoading(false); }
  }

  async function handleUnlock() {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.admin.users.update(user.id, { lockedUntil: null });
      toast.success(`${user.email} unlocked.`);
      setAction(null);
      void load();
    } catch { toast.error("Failed to unlock account."); }
    finally { setActionLoading(false); }
  }

  async function handleChangeRole() {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.admin.users.update(user.id, { role: newRole });
      toast.success(`${user.email} role changed to ${newRole}.`);
      setAction(null);
      void load();
    } catch { toast.error("Failed to change role."); }
    finally { setActionLoading(false); }
  }

  async function handleDelete() {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.admin.users.delete(user.id);
      toast.success(`${user.email} has been soft-deleted.`);
      setAction(null);
      router.push("/users");
    } catch { toast.error("Failed to delete user."); }
    finally { setActionLoading(false); }
  }

  // ── Loading / not-found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="User not found"
        description="This user may have been deleted or the link is invalid."
      >
        <Button variant="outline" asChild>
          <Link href="/users">Back to users</Link>
        </Button>
      </EmptyState>
    );
  }

  const displayName = profileDisplayName(user);
  const accountStatus = deriveAccountStatus(user);
  const isLocked = accountStatus === "locked";
  const accountAgeDays = Math.floor((Date.now() - +new Date(user.createdAt)) / 86400_000);
  const profile = user.profile;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.push("/users")}
      >
        <ArrowLeft className="size-4" />
        All users
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <PatientAvatar
                name={displayName}
                color={emailToColor(user.email)}
                className="size-16 text-lg"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
                  <RoleBadge role={user.role} />
                  <AccountStatusBadge status={accountStatus} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Joined {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => openAction("role")}>
                <UserCog className="size-4" />
                Change role
              </Button>
              {isLocked ? (
                <Button variant="outline" onClick={() => openAction("unlock")}>
                  <Unlock className="size-4" />
                  Unlock
                </Button>
              ) : (
                <Button variant="outline" onClick={() => openAction("lock")}>
                  <Lock className="size-4" />
                  Lock
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon"
                onClick={() => openAction("delete")}
                aria-label="Delete user"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          {clinicalAccess && (
            <>
              <TabsTrigger value="health">
                <Lock className="size-3.5" /> Health
              </TabsTrigger>
              <TabsTrigger value="labs">Labs</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="user-integrations">Integrations</TabsTrigger>
              <TabsTrigger value="protocol">Protocol</TabsTrigger>
              <TabsTrigger value="coach">Coach</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ───────── Overview ───────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Account summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryRow label="Plan">
                  {user.subscription ? (
                    <TierBadge tier={user.subscription.tier} />
                  ) : (
                    <span className="text-sm text-muted-foreground">No subscription</span>
                  )}
                </SummaryRow>
                <SummaryRow label="Billing">
                  {user.subscription ? (
                    <SubStatusBadge status={user.subscription.status} />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </SummaryRow>
                <SummaryRow label="Account">
                  <AccountStatusBadge status={accountStatus} />
                </SummaryRow>
                <SummaryRow label="Email verified">
                  <Badge variant={user.emailVerifiedAt ? "success" : "warning"}>
                    {user.emailVerifiedAt ? "Verified" : "Unverified"}
                  </Badge>
                </SummaryRow>
                <SummaryRow label="Member for">
                  <span className="text-sm font-medium">{accountAgeDays} days</span>
                </SummaryRow>
                {user.subscription?.cancelAtPeriodEnd && (
                  <SummaryRow label="Subscription">
                    <Badge variant="warning">Cancels at period end</Badge>
                  </SummaryRow>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Account and identity fields</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="User ID" value={user.id} mono />
                <Field label="Email" value={user.email} />
                <Field label="Role" value={user.role} />
                <Field label="Member since" value={formatDate(user.createdAt)} />
                <Field
                  label="Last login"
                  value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
                />
                <Field
                  label="Email verified"
                  value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "No"}
                />
                {profile && typeof profile.firstName === "string" && (
                  <Field label="First name" value={profile.firstName} />
                )}
                {profile && typeof profile.lastName === "string" && (
                  <Field label="Last name" value={profile.lastName} />
                )}
                {profile && typeof profile.dateOfBirth === "string" && (
                  <Field label="Date of birth" value={formatDate(profile.dateOfBirth)} />
                )}
                {profile && typeof profile.biologicalSex === "string" && (
                  <Field label="Biological sex" value={profile.biologicalSex} />
                )}
                {profile && typeof profile.heightCm === "number" && (
                  <Field label="Height" value={`${profile.heightCm} cm`} />
                )}
                {profile && typeof profile.weightKg === "number" && (
                  <Field label="Weight" value={`${profile.weightKg} kg`} />
                )}
                {profile && typeof profile.phone === "string" && (
                  <Field label="Phone" value={profile.phone} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────── Activity ───────── */}
        <TabsContent value="activity">
          <EmptyState
            icon={Clock}
            title="Requires backend integration"
            description="Activity data is coming in Workstream B — admin-scoped engagement endpoints are not yet available."
            className="mt-4"
          />
        </TabsContent>

        {/* ───────── Billing ───────── */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.subscription ? (
                <>
                  <div className="flex items-center gap-2">
                    <TierBadge tier={user.subscription.tier} />
                    <SubStatusBadge status={user.subscription.status} />
                    {user.subscription.cancelAtPeriodEnd && (
                      <Badge variant="warning">Cancels at period end</Badge>
                    )}
                  </div>
                  <Separator />
                  <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="MRR" value="— (requires Stripe price data)" />
                    <Field
                      label="Renews"
                      value={
                        user.subscription.currentPeriodEnd
                          ? formatDate(user.subscription.currentPeriodEnd)
                          : "—"
                      }
                    />
                    <Field
                      label="Cancel at period end"
                      value={user.subscription.cancelAtPeriodEnd ? "Yes" : "No"}
                    />
                    <Field
                      label="Stripe customer"
                      value={user.subscription.stripeCustomerId ?? "—"}
                      mono
                    />
                  </div>
                  {user.subscription.stripeCustomerId && (
                    <Button variant="outline" asChild>
                      <a
                        href={`https://dashboard.stripe.com/customers/${user.subscription.stripeCustomerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-4" />
                        Open in Stripe
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No subscription"
                  description="This user does not have an active subscription record."
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────── Account ───────── */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account & security</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="User ID" value={user.id} mono />
              <Field label="Role" value={user.role} />
              <Field
                label="Email verified"
                value={user.emailVerifiedAt ? "Yes" : "No"}
              />
              <Field
                label="Last login"
                value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
              />
              <Field
                label="Failed login attempts"
                value={String(user.failedLoginAttempts)}
              />
              <Field
                label="Account created"
                value={formatDate(user.createdAt)}
              />
              <Field
                label="Last updated"
                value={formatDate(user.updatedAt)}
              />
              <Field
                label="Locked until"
                value={
                  user.lockedUntil
                    ? formatDateTime(user.lockedUntil)
                    : "Not locked"
                }
              />
              {user.deletedAt && (
                <Field label="Deleted at" value={formatDateTime(user.deletedAt)} />
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-4" />
                Danger zone
              </CardTitle>
              <CardDescription>
                Soft-deletes the user and revokes all active sessions. This can
                be reversed by the platform team within 30 days. Does not cancel
                the Stripe subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => openAction("delete")}>
                <Trash2 className="size-4" />
                Delete user account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ CLINICAL (gated) — all placeholder ═══════════ */}
        {clinicalAccess && (
          <>
            <TabsContent value="health" className="mt-4 space-y-4">
              {medHistoryLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : medHistoryError ? (
                <EmptyState icon={Stethoscope} title="Failed to load medical history" className="mt-4" />
              ) : medHistory ? (
                <>
                  <MedHistorySection title="Allergies">
                    {medHistory.allergies.length === 0 ? <NoData /> : medHistory.allergies.map((a) => (
                      <div key={a.id} className="text-sm">
                        <span className="font-medium">{a.name}</span>
                        {a.reaction && <span className="text-muted-foreground"> — {a.reaction}</span>}
                        {a.severity && <span className="ml-2 text-xs text-muted-foreground">({a.severity})</span>}
                      </div>
                    ))}
                  </MedHistorySection>
                  <MedHistorySection title="Past Conditions">
                    {medHistory.pastConditions.length === 0 ? <NoData /> : medHistory.pastConditions.map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-medium">{c.name}</span>
                        {c.diagnosedYear && <span className="text-muted-foreground"> ({c.diagnosedYear})</span>}
                        {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                      </div>
                    ))}
                  </MedHistorySection>
                  <MedHistorySection title="Surgeries">
                    {medHistory.surgeries.length === 0 ? <NoData /> : medHistory.surgeries.map((s) => (
                      <div key={s.id} className="text-sm">
                        <span className="font-medium">{s.procedure}</span>
                        {s.year && <span className="text-muted-foreground"> ({s.year})</span>}
                        {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                      </div>
                    ))}
                  </MedHistorySection>
                  <MedHistorySection title="Family History">
                    {medHistory.familyHistory.length === 0 ? <NoData /> : medHistory.familyHistory.map((f) => (
                      <div key={f.id} className="text-sm">
                        <span className="font-medium">{f.relation}</span>
                        <span className="text-muted-foreground"> — {f.condition}</span>
                      </div>
                    ))}
                  </MedHistorySection>
                  <MedHistorySection title="Social History">
                    {!medHistory.socialHistory ? <NoData /> : (
                      <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                        {medHistory.socialHistory.smokingStatus && (
                          <Field label="Smoking" value={String(medHistory.socialHistory.smokingStatus)} />
                        )}
                        {medHistory.socialHistory.alcoholConsumption && (
                          <Field label="Alcohol" value={String(medHistory.socialHistory.alcoholConsumption)} />
                        )}
                        {medHistory.socialHistory.exerciseLevel && (
                          <Field label="Exercise" value={String(medHistory.socialHistory.exerciseLevel)} />
                        )}
                      </div>
                    )}
                  </MedHistorySection>
                  <MedHistorySection title="Medications">
                    {medHistory.medications.length === 0 ? <NoData /> : medHistory.medications.map((m) => (
                      <div key={m.id} className="text-sm">
                        <span className="font-medium">{m.name}</span>
                        {m.dose && <span className="text-muted-foreground"> {m.dose}</span>}
                        {m.frequency && <span className="text-muted-foreground"> · {m.frequency}</span>}
                      </div>
                    ))}
                  </MedHistorySection>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="labs" className="mt-4">
              {labsLoading ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : labsError ? (
                <EmptyState icon={FlaskConical} title="Failed to load lab results" className="mt-4" />
              ) : labs !== null ? (
                <Card>
                  <CardContent className="p-0">
                    {labs.length === 0 ? (
                      <EmptyState icon={FlaskConical} title="No lab results" description="No lab results have been uploaded for this user." className="m-5" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-5">Marker</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Reference range</TableHead>
                            <TableHead>Panel</TableHead>
                            <TableHead>Lab</TableHead>
                            <TableHead className="pr-5">Collected</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {labs.map((lab) => (
                            <TableRow key={lab.id} className={lab.flagged ? "bg-destructive/5" : undefined}>
                              <TableCell className="pl-5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{lab.markerName}</span>
                                  {lab.flagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-medium tabular-nums">
                                {lab.value} {lab.unit}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {lab.referenceRange ?? "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {lab.panelName ?? "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {lab.labName ?? "—"}
                              </TableCell>
                              <TableCell className="pr-5 text-sm text-muted-foreground">
                                {formatDate(lab.collectedDate)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="tracking" className="mt-4">
              {trackingLoading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                </div>
              ) : trackingError ? (
                <EmptyState icon={Activity} title="Failed to load tracking data" className="mt-4" />
              ) : tracking ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Health Snapshot</CardTitle>
                      <CardDescription>Rolling window stats from logged data</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                      <Field label="Symptoms (last 30d)" value={String(tracking.dashboard.data.symptomsLast30)} />
                      <Field
                        label="Avg severity (last 30d)"
                        value={tracking.dashboard.data.avgSeverityLast30 != null ? String(tracking.dashboard.data.avgSeverityLast30) : "—"}
                      />
                      <Field label="Meals logged (last 7d)" value={String(tracking.dashboard.data.mealsLast7)} />
                      <Field
                        label="Avg sleep (last 7d)"
                        value={tracking.dashboard.data.avgSleepHoursLast7 != null ? `${tracking.dashboard.data.avgSleepHoursLast7}h` : "—"}
                      />
                      <Field label="Active medications" value={String(tracking.dashboard.data.activeMedications)} />
                      <Field label="Active supplements" value={String(tracking.dashboard.data.activeSupplements)} />
                      {tracking.dashboard.data.latestWeight && (
                        <Field
                          label="Latest weight"
                          value={`${tracking.dashboard.data.latestWeight.value} ${tracking.dashboard.data.latestWeight.unit}`}
                        />
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Metabolic Score</CardTitle>
                      <CardDescription>Composite score out of 100</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-6">
                        <ScoreRing score={tracking.summary.data.metabolicScore} size={80} />
                        <div className="flex-1 grid gap-y-2 gap-x-8 grid-cols-2">
                          {(["labs", "symptoms", "sleep", "lifestyle", "nutrition"] as const).map((domain) => {
                            const score = tracking.summary.data.scoreBreakdown[domain];
                            const max = tracking.summary.data.scoreBreakdown[`${domain}Max` as keyof typeof tracking.summary.data.scoreBreakdown];
                            return (
                              <Field key={domain} label={domain.charAt(0).toUpperCase() + domain.slice(1)} value={`${score} / ${max}`} />
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              {docsLoading ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : docsError ? (
                <EmptyState icon={FileText} title="Failed to load documents" className="mt-4" />
              ) : docs !== null ? (
                <Card>
                  <CardContent className="p-0">
                    {docs.length === 0 ? (
                      <EmptyState icon={FileText} title="No documents" description="No documents have been uploaded for this user." className="m-5" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-5">Filename</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>OCR status</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="pr-5 text-right">Download</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {docs.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="pl-5 text-sm font-medium">{doc.originalFilename}</TableCell>
                              <TableCell><Badge variant="secondary">{doc.docType.replace(/_/g, " ")}</Badge></TableCell>
                              <TableCell>
                                <Badge variant={doc.ocrStatus === "COMPLETE" ? "success" : doc.ocrStatus === "FAILED" ? "destructive" : "warning"}>
                                  {doc.ocrStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                              <TableCell className="pr-5 text-right">
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-3.5" />
                                    Open
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="user-integrations" className="mt-4">
              {userIntegrationsLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              ) : userIntegrationsError ? (
                <EmptyState icon={Cable} title="Failed to load integrations" className="mt-4" />
              ) : userIntegrations !== null ? (
                userIntegrations.filter((i) => i.status !== "NOT_CONNECTED").length === 0 ? (
                  <EmptyState icon={Cable} title="No connected integrations" description="This user has not connected any health integrations." className="mt-4" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {userIntegrations.filter((i) => i.status !== "NOT_CONNECTED").map((integration) => (
                      <Card key={integration.provider}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">{integration.provider.replace(/_/g, " ")}</CardTitle>
                            <Badge variant={integration.status === "CONNECTED" ? "success" : integration.status === "ERROR" ? "destructive" : "warning"}>
                              {integration.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs text-muted-foreground">
                          {integration.lastSyncedAt && (
                            <p>Last synced: {formatDate(integration.lastSyncedAt)}</p>
                          )}
                          {integration.errorMessage && (
                            <p className="text-destructive">{integration.errorMessage}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : null}
            </TabsContent>

            <TabsContent value="protocol">
              <EmptyState
                icon={Sparkles}
                title="Requires backend integration"
                description="Protocol endpoints are coming in Workstream B."
                className="mt-4"
              />
            </TabsContent>

            <TabsContent value="coach">
              <EmptyState
                icon={Bot}
                title="Requires backend integration"
                description="Coach conversation endpoints are coming in Workstream B."
                className="mt-4"
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* ── Lock dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={action === "lock"} onOpenChange={closeAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock account?</DialogTitle>
            <DialogDescription>
              This will prevent <span className="font-medium">{user.email}</span> from
              signing in for 15 minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLock} disabled={actionLoading}>
              {actionLoading ? "Locking…" : "Lock account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unlock dialog ────────────────────────────────────────────────────── */}
      <Dialog open={action === "unlock"} onOpenChange={closeAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock account?</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{user.email}</span> will be able to sign in
              immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleUnlock} disabled={actionLoading}>
              {actionLoading ? "Unlocking…" : "Unlock account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change role dialog ───────────────────────────────────────────────── */}
      <Dialog open={action === "role"} onOpenChange={closeAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Changing the role for <span className="font-medium">{user.email}</span>.
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
            <Button variant="outline" onClick={closeAction} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={actionLoading}>
              {actionLoading ? "Saving…" : "Save role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ────────────────────────────────────────────────────── */}
      <Dialog open={action === "delete"} onOpenChange={closeAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This is a soft delete — the user record will be marked deleted but not
              permanently removed. Their Stripe subscription will{" "}
              <span className="font-medium text-foreground">not</span> be canceled
              automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-email">
              Type <span className="font-mono text-foreground">{user.email}</span> to confirm
            </Label>
            <Input
              id="confirm-email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={user.email}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading || deleteConfirmEmail !== user.email}
            >
              {actionLoading ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function MedHistorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function NoData() {
  return <p className="text-sm text-muted-foreground">No data recorded</p>;
}
