"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, MailX } from "lucide-react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<Status>(
    token ? "verifying" : "no-token"
  );
  const [errorMsg, setErrorMsg] = React.useState("");

  // Run once — guard against React strict-mode double-invoke in development.
  const didRun = React.useRef(false);
  React.useEffect(() => {
    if (!token || didRun.current) return;
    didRun.current = true;

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setErrorMsg(
          err instanceof Error ? err.message : "Verification failed."
        );
        setStatus("error");
      });
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-success/12 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">Email verified</h2>
          <p className="text-sm text-muted-foreground">
            Your email address has been confirmed. You can now sign in to your
            account.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </motion.div>
    );
  }

  if (status === "no-token") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
          <MailX className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">Invalid link</h2>
          <p className="text-sm text-muted-foreground">
            This verification link is missing a token. Please use the link sent
            to your email.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </motion.div>
    );
  }

  // status === "error"
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">
          Verification failed
        </h2>
        <p className="text-sm text-muted-foreground">
          {errorMsg || "This link may have expired or already been used."}
        </p>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
