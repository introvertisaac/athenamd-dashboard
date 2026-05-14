import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AccountStatus,
  LabStatus,
  OcrStatus,
  SubscriptionStatus,
  SubscriptionTier,
} from "@/lib/types";

export function TierBadge({ tier }: { tier: SubscriptionTier }) {
  const map = {
    FREE: { variant: "secondary" as const, label: "Free" },
    PRO: { variant: "info" as const, label: "Pro" },
    PREMIUM: { variant: "default" as const, label: "Premium" },
  };
  const { variant, label } = map[tier];
  return <Badge variant={variant}>{label}</Badge>;
}

export function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const map = {
    ACTIVE: { variant: "success" as const, label: "Active" },
    TRIALING: { variant: "info" as const, label: "Trialing" },
    PAST_DUE: { variant: "warning" as const, label: "Past due" },
    CANCELED: { variant: "secondary" as const, label: "Canceled" },
    INCOMPLETE: { variant: "destructive" as const, label: "Incomplete" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const map = {
    active: { variant: "success" as const, label: "Active", dot: "bg-success" },
    locked: { variant: "warning" as const, label: "Locked", dot: "bg-warning" },
    deleted: { variant: "destructive" as const, label: "Deleted", dot: "bg-destructive" },
    pending: { variant: "secondary" as const, label: "Pending", dot: "bg-muted-foreground" },
  };
  const { variant, label, dot } = map[status];
  return (
    <Badge variant={variant} className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}

export function LabStatusBadge({ status }: { status: LabStatus }) {
  const map = {
    optimal: { variant: "success" as const, label: "Optimal" },
    suboptimal: { variant: "warning" as const, label: "Suboptimal" },
    out_of_range: { variant: "destructive" as const, label: "Out of range" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function OcrStatusBadge({ status }: { status: OcrStatus }) {
  const map = {
    PENDING: { variant: "secondary" as const, label: "Pending" },
    PROCESSING: { variant: "info" as const, label: "Processing" },
    COMPLETE: { variant: "success" as const, label: "Complete" },
    FAILED: { variant: "destructive" as const, label: "Failed" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function RoleBadge({ role }: { role: "PATIENT" | "ADMIN" }) {
  return role === "ADMIN" ? (
    <Badge variant="accent">Admin</Badge>
  ) : (
    <Badge variant="outline">Patient</Badge>
  );
}
