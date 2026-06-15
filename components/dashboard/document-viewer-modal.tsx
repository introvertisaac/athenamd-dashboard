"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DocumentViewerDocument {
  downloadUrl: string;
  originalFilename: string;
  mimeType: string;
}

interface DocumentViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentViewerDocument | null;
}

const EXPIRY_MS = 5 * 60 * 1000;

export function DocumentViewerModal({
  open,
  onOpenChange,
  document: doc,
}: DocumentViewerModalProps) {
  const [expired, setExpired] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setExpired(false);
      return;
    }
    const id = setTimeout(() => setExpired(true), EXPIRY_MS);
    return () => clearTimeout(id);
  }, [open]);

  function renderPreview() {
    if (!doc) return null;
    if (expired) {
      return (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Link expired — please close and reopen to refresh.
        </p>
      );
    }
    if (doc.mimeType.startsWith("image/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={doc.downloadUrl}
          alt={doc.originalFilename}
          className="max-h-[70vh] w-full rounded object-contain"
        />
      );
    }
    if (doc.mimeType === "application/pdf") {
      return (
        <iframe
          src={doc.downloadUrl}
          title={doc.originalFilename}
          className="h-[70vh] w-full rounded border-0"
        />
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-muted-foreground">
          Preview not available for this file type.
        </p>
        <Button asChild variant="outline">
          <a href={doc.downloadUrl} download={doc.originalFilename} target="_blank" rel="noopener noreferrer">
            <Download className="size-4" />
            Download file
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {doc?.originalFilename ?? "Document"}
          </DialogTitle>
        </DialogHeader>
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
}
