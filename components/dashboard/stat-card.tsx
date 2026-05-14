"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  accent = "primary",
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  accent?: "primary" | "info" | "success" | "warning" | "destructive";
  index?: number;
}) {
  const accentMap = {
    primary: "bg-accent text-accent-foreground",
    info: "bg-info/12 text-info",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    destructive: "bg-destructive/12 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl [&_svg]:size-5",
              accentMap[accent],
            )}
          >
            <Icon />
          </span>
        </div>
        {(delta !== undefined || hint) && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-semibold",
                  delta >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {delta >= 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
