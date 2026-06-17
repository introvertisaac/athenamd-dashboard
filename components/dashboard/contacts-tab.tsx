"use client";

import * as React from "react";
import { Mail, MapPin, Phone, Printer, Stethoscope } from "lucide-react";
import type { ClinicianContact } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/dashboard/empty-state";

interface Props {
  contacts: ClinicianContact[] | null;
  loading: boolean;
  error: boolean;
}

export function ContactsTab({ contacts, loading, error }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Failed to load clinician contacts"
        className="mt-4"
      />
    );
  }
  if (!contacts || contacts.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No clinician contacts recorded"
        description="This patient has not added any clinician contacts yet."
        className="mt-4"
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contacts.map((c) => (
        <ContactCard key={c.id} contact={c} />
      ))}
    </div>
  );
}

function ContactCard({ contact: c }: { contact: ClinicianContact }) {
  const hasDetails = c.practice || c.phone || c.email || c.fax || c.address;
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold leading-snug">{c.name}</p>
            {c.specialty && (
              <p className="text-xs text-muted-foreground">{c.specialty}</p>
            )}
          </div>
          {c.isPrimary && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Primary
            </Badge>
          )}
        </div>
        {hasDetails && <Separator />}
        <div className="space-y-1.5">
          {c.practice && (
            <p className="text-xs text-muted-foreground">{c.practice}</p>
          )}
          {c.phone && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              {c.phone}
            </p>
          )}
          {c.email && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {c.email}
            </p>
          )}
          {c.fax && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Printer className="size-3 shrink-0" />
              {c.fax}
            </p>
          )}
          {c.address && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              {c.address}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
