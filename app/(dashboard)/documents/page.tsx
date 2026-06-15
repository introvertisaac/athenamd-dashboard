"use client";

import * as React from "react";
import { FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DocumentViewerModal, type DocumentViewerDocument } from "@/components/dashboard/document-viewer-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  type AdminDocumentItem,
  type AdminDocumentsParams,
} from "@/lib/api";
import { relativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

type OcrFilter = "all" | "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";

const OCR_BADGE_VARIANT: Record<
  AdminDocumentItem["ocrStatus"],
  "info" | "warning" | "success" | "destructive"
> = {
  PENDING: "info",
  PROCESSING: "warning",
  COMPLETE: "success",
  FAILED: "destructive",
};

const DOC_TYPE_LABEL: Record<AdminDocumentItem["docType"], string> = {
  LAB_REPORT: "Lab report",
  IMAGING: "Imaging",
  PRESCRIPTION: "Prescription",
  OTHER: "Other",
};

export default function DocumentsPage() {
  const [ocrFilter, setOcrFilter] = React.useState<OcrFilter>("all");
  const [page, setPage] = React.useState(1);

  const [docs, setDocs] = React.useState<AdminDocumentItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [reprocessingId, setReprocessingId] = React.useState<string | null>(null);
  const [viewDoc, setViewDoc] = React.useState<DocumentViewerDocument | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);

  // Reset page when filter changes
  React.useEffect(() => { setPage(1); }, [ocrFilter]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params: AdminDocumentsParams = { page, limit: PAGE_SIZE };
      if (ocrFilter !== "all") params.ocrStatus = ocrFilter;
      const res = await api.admin.documents.list(params);
      setDocs(res.data);
      setTotal(res.total);
    } catch {
      setError(true);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [page, ocrFilter]);

  React.useEffect(() => { void load(); }, [load]);

  async function handleReprocess(id: string) {
    setReprocessingId(id);
    try {
      await api.admin.documents.reprocess(id);
      toast.success("Reprocess queued");
      void load();
    } catch {
      toast.error("Failed to queue reprocess");
    } finally {
      setReprocessingId(null);
    }
  }

  function handleView(doc: AdminDocumentItem) {
    setViewDoc({
      downloadUrl: doc.downloadUrl,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
    });
    setViewerOpen(true);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="All patient-uploaded documents and OCR processing status."
      />

      <Tabs value={ocrFilter} onValueChange={(v) => setOcrFilter(v as OcrFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
          <TabsTrigger value="FAILED">Failed</TabsTrigger>
          <TabsTrigger value="COMPLETE">Complete</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-px p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon={FileText} title="Failed to load documents" className="m-5">
              <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
            </EmptyState>
          ) : docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents match the current filter"
              className="m-5"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>OCR status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="pl-5 text-sm">
                      {doc.userEmail}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm font-medium">
                      {doc.originalFilename}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {DOC_TYPE_LABEL[doc.docType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={OCR_BADGE_VARIANT[doc.ocrStatus]}>
                        {doc.ocrStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeTime(doc.uploadedAt)}
                    </TableCell>
                    <TableCell className="pr-5">
                      {doc.ocrStatus === "FAILED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reprocessingId === doc.id}
                          onClick={() => void handleReprocess(doc.id)}
                        >
                          {reprocessingId === doc.id ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <RefreshCw className="size-3.5" />
                          )}
                          Reprocess
                        </Button>
                      )}
                      {doc.ocrStatus === "COMPLETE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                        >
                          View
                        </Button>
                      )}
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

      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={viewDoc}
      />
    </div>
  );
}
