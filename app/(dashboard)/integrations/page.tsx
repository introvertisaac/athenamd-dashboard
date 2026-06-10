"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Cable, CheckCircle2, Plug, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type IntegrationSummaryItem } from "@/lib/api";

// ─── Static provider metadata ─────────────────────────────────────────────────

type Category = "Wearables" | "Health Platforms" | "Labs" | "Nutrition";

interface ProviderMeta {
  name: string;
  category: Category;
  iconColor: string;
  description: string;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  OURA:         { name: "Oura Ring",       category: "Wearables",        iconColor: "#1a1a1a", description: "Sleep stages, HRV, and readiness scores from Oura." },
  GARMIN:       { name: "Garmin",          category: "Wearables",        iconColor: "#007cc3", description: "Activity, heart rate, and training load from Garmin devices." },
  FITBIT:       { name: "Fitbit",          category: "Wearables",        iconColor: "#00b0b9", description: "Steps, sleep, and heart rate from Fitbit wearables." },
  WHOOP:        { name: "WHOOP",           category: "Wearables",        iconColor: "#00c853", description: "Recovery and strain data from WHOOP strap." },
  APPLE_HEALTH: { name: "Apple Health",    category: "Health Platforms",  iconColor: "#ff2d55", description: "HealthKit data from iPhone and Apple Watch." },
  GOOGLE_FIT:   { name: "Google Fit",      category: "Health Platforms",  iconColor: "#4285f4", description: "Activity and health metrics from Google Fit." },
  WITHINGS:     { name: "Withings",        category: "Health Platforms",  iconColor: "#008c65", description: "Smart scale, blood pressure, and sleep data." },
  DEXCOM:       { name: "Dexcom",          category: "Health Platforms",  iconColor: "#007dc5", description: "Continuous glucose monitoring data from Dexcom CGM." },
  LABCORP:      { name: "LabCorp",         category: "Labs",              iconColor: "#c8102e", description: "Lab results imported directly from LabCorp." },
  QUEST:        { name: "Quest Diagnostics", category: "Labs",            iconColor: "#0033a0", description: "Lab results imported directly from Quest." },
  CRONOMETER:   { name: "Cronometer",      category: "Nutrition",         iconColor: "#f5a623", description: "Detailed micronutrient and macro tracking." },
  MYFITNESSPAL: { name: "MyFitnessPal",    category: "Nutrition",         iconColor: "#0066cc", description: "Food logging and calorie tracking data." },
};

const CATEGORIES: Category[] = ["Wearables", "Health Platforms", "Labs", "Nutrition"];

function providerMeta(provider: string): ProviderMeta {
  return PROVIDER_META[provider] ?? {
    name: provider.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    category: "Health Platforms",
    iconColor: "var(--chart-3)",
    description: "Third-party health data integration.",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [items, setItems] = React.useState<IntegrationSummaryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api.admin.integrations.summary()
      .then((r) => { setItems(r.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); toast.error("Failed to load integrations"); });
  }, []);

  const totalConnections = items.reduce((s, i) => s + i.totalConnected, 0);
  const liveProviders = items.filter((i) => i.totalConnected > 0).length;
  const errorProviders = items.filter((i) => (i.statusBreakdown["ERROR"] ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Third-party data sources patients can connect to AthenaMD."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Active providers"
          value={loading ? "—" : liveProviders}
          icon={Zap}
          accent="success"
        />
        <StatCard
          index={1}
          label="Total connections"
          value={loading ? "—" : totalConnections}
          icon={Cable}
          accent="primary"
        />
        <StatCard
          index={2}
          label="Providers with errors"
          value={loading ? "—" : errorProviders}
          icon={CheckCircle2}
          accent={errorProviders > 0 ? "warning" : "success"}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={Cable} title="Failed to load integrations">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState icon={Cable} title="No integration data yet" description="Connect patients to third-party providers to see summary data here." />
      ) : (
        CATEGORIES.map((category) => {
          const categoryItems = items.filter((i) => providerMeta(i.provider).category === category);
          if (categoryItems.length === 0) return null;
          return (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item, idx) => {
                  const meta = providerMeta(item.provider);
                  const errorCount = item.statusBreakdown["ERROR"] ?? 0;
                  const connectedCount = item.statusBreakdown["CONNECTED"] ?? 0;
                  const pendingCount = item.statusBreakdown["PENDING"] ?? 0;
                  const hasErrors = errorCount > 0;
                  return (
                    <motion.div
                      key={item.provider}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                    >
                      <Card className={`h-full${hasErrors ? " border-warning/50" : ""}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <span
                              className="flex size-11 items-center justify-center rounded-xl text-white"
                              style={{ backgroundColor: meta.iconColor }}
                            >
                              <Plug className="size-5" />
                            </span>
                            {hasErrors ? (
                              <div className="flex items-center gap-1 text-xs font-medium text-warning">
                                <AlertTriangle className="size-3.5" />
                                {errorCount} error{errorCount !== 1 ? "s" : ""}
                              </div>
                            ) : (
                              <Badge variant={item.totalConnected > 0 ? "success" : "secondary"}>
                                {item.totalConnected > 0 ? "Active" : "Unused"}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="pt-2 text-base">{meta.name}</CardTitle>
                          <CardDescription>{meta.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {connectedCount > 0 && (
                              <Badge variant="success" className="text-xs">{connectedCount} connected</Badge>
                            )}
                            {pendingCount > 0 && (
                              <Badge variant="warning" className="text-xs">{pendingCount} pending</Badge>
                            )}
                            {errorCount > 0 && (
                              <Badge variant="destructive" className="text-xs">{errorCount} error{errorCount !== 1 ? "s" : ""}</Badge>
                            )}
                            {item.totalConnected === 0 && connectedCount === 0 && pendingCount === 0 && errorCount === 0 && (
                              <span className="text-sm text-muted-foreground">No connections yet</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {item.totalConnected} patient{item.totalConnected !== 1 ? "s" : ""} connected
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success(`${meta.name} settings opened (demo).`)}
                            >
                              Configure
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
