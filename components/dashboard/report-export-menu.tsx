"use client";

import * as React from "react";
import { Download, FileText, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { api, type ReportResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReportKind = "health-summary" | "lab-results";

// Opens the presigned URL in a new tab. The URL is already a direct download
// link, so we never fetch the bytes ourselves. If the browser blocks the popup
// (the URL only exists after an awaited request, so it can fall outside the
// click gesture), fall back to a programmatic anchor click on the same URL.
function openInNewTab(url: string): void {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) return;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Shared generate → toast → open-tab logic so the dropdown and the standalone
// labs button behave identically. `generating` is the kind currently in flight
// (or null), letting callers show a spinner and disable controls.
export function useReportExport() {
  const [generating, setGenerating] = React.useState<ReportKind | null>(null);

  const run = React.useCallback(
    async (kind: ReportKind, request: () => Promise<{ data: ReportResponse }>) => {
      if (generating) return;
      setGenerating(kind);
      const toastId = toast.loading("Generating report…");
      try {
        const res = await request();
        toast.success("Report ready", { id: toastId });
        openInNewTab(res.data.downloadUrl);
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "status" in err
            ? (err as { status?: number }).status
            : undefined;
        if (status === 429) {
          toast.error("Rate limit reached — try again in a few minutes", { id: toastId });
        } else if (status === 403) {
          // apiFetch already surfaced an "Access denied" toast — just clear ours.
          toast.dismiss(toastId);
        } else {
          const message = err instanceof Error ? err.message : "Failed to generate report";
          toast.error(message || "Failed to generate report", { id: toastId });
        }
      } finally {
        setGenerating(null);
      }
    },
    [generating]
  );

  return { generating, run };
}

// Reusable "Export ▾" dropdown for a user's PDF reports. Drop it anywhere a
// userId is known (e.g. the user detail header).
export function ReportExportMenu({ userId }: { userId: string }) {
  const { generating, run } = useReportExport();
  const busy = generating !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy}>
          {busy ? <Spinner /> : <Download className="size-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault(); // keep the menu open so the spinner is visible
            void run("health-summary", () => api.admin.reports.healthSummary(userId));
          }}
        >
          {generating === "health-summary" ? <Spinner /> : <FileText className="size-4" />}
          Health Summary (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault();
            void run("lab-results", () => api.admin.reports.labResults(userId));
          }}
        >
          {generating === "lab-results" ? <Spinner /> : <FlaskConical className="size-4" />}
          Lab Results (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Standalone "Export as PDF" button for the labs tab. Passes an optional date
// range through to the report; omit it to export all results.
export function ExportLabsPdfButton({
  userId,
  params,
}: {
  userId: string;
  params?: { from?: string; to?: string };
}) {
  const { generating, run } = useReportExport();
  const busy = generating !== null;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => void run("lab-results", () => api.admin.reports.labResults(userId, params))}
    >
      {busy ? <Spinner /> : <Download className="size-4" />}
      Export as PDF
    </Button>
  );
}
