"use client";

import { motion } from "framer-motion";
import { Cable, CheckCircle2, Plug, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { INTEGRATIONS, PATIENTS_ONLY } from "@/lib/data";

const STATUS_BADGE = {
  available: { variant: "success" as const, label: "Available" },
  beta: { variant: "info" as const, label: "Beta" },
  coming_soon: { variant: "secondary" as const, label: "Coming soon" },
};

const CATEGORIES = [
  "Wearables",
  "Health Platforms",
  "Labs",
  "Nutrition",
] as const;

export default function IntegrationsPage() {
  const live = INTEGRATIONS.filter((i) => i.status === "available").length;
  const totalConnections = INTEGRATIONS.reduce(
    (s, i) => s + i.connectedPatients,
    0,
  );
  const connectedPatients = PATIENTS_ONLY.filter(
    (p) => p.connectedIntegrations.length > 0,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Third-party data sources patients can connect to MetaboAI."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Live integrations"
          value={live}
          icon={Zap}
          accent="success"
        />
        <StatCard
          index={1}
          label="Total connections"
          value={totalConnections}
          icon={Cable}
          accent="primary"
        />
        <StatCard
          index={2}
          label="Patients connected"
          value={`${connectedPatients}/${PATIENTS_ONLY.length}`}
          icon={CheckCircle2}
          accent="info"
        />
      </div>

      {CATEGORIES.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((i, idx) => {
                const badge = STATUS_BADGE[i.status];
                const connectable = i.status !== "coming_soon";
                return (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <span
                            className="flex size-11 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: i.iconColor }}
                          >
                            <Plug className="size-5" />
                          </span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <CardTitle className="pt-2 text-base">
                          {i.name}
                        </CardTitle>
                        <CardDescription>{i.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {i.connectedPatients > 0
                            ? `${i.connectedPatients} patient${i.connectedPatients !== 1 ? "s" : ""} connected`
                            : "No connections yet"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!connectable}
                          onClick={() =>
                            toast.success(`${i.name} settings opened (demo).`)
                          }
                        >
                          {connectable ? "Configure" : "Notify me"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
