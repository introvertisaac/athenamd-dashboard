"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter the email associated with your account.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success("If that account exists, a reset link is on its way.");
    }, 800);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {sent ? (
        <div className="space-y-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-success/12 text-success">
            <MailCheck className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>. The
              link expires in 1 hour.
            </p>
          </div>
          <div className="rounded-lg border border-dashed bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            Demo environment —{" "}
            <Link href="/reset-password" className="font-medium text-primary hover:underline">
              open the reset screen
            </Link>{" "}
            directly.
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">
              Forgot password?
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your account email and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@metaboai.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link href="/login">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </>
      )}
    </motion.div>
  );
}
