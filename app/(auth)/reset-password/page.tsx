"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = [
  "bg-muted",
  "bg-destructive",
  "bg-warning",
  "bg-info",
  "bg-success",
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const score = strength(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score < 2) {
      toast.error("Choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success("Password updated. Please sign in.");
      router.replace("/login");
    }, 800);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-8 space-y-1.5">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <ShieldCheck className="size-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Set a new password</h2>
        <p className="text-sm text-muted-foreground">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < score ? STRENGTH_COLOR[score] : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span className="font-medium text-foreground">
                  {STRENGTH_LABEL[score]}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
          />
          {mismatch && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}
          {confirm.length > 0 && !mismatch && (
            <p className="flex items-center gap-1 text-xs text-success">
              <Check className="size-3" /> Passwords match
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Updating…" : "Reset password"}
        </Button>
      </form>

      <Button asChild variant="ghost" className="mt-4 w-full">
        <Link href="/login">
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </Button>
    </motion.div>
  );
}
