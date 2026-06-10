"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isReady } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isReady && user) router.replace("/overview");
  }, [isReady, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Enter your email and password to continue.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to AthenaMD Admin.");
      router.replace("/overview");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign in failed";

      if (message.includes("Admin access required")) {
        setErrorMsg("Admin access required. This account does not have admin privileges.");
      } else if (
        message.toLowerCase().includes("locked") ||
        (err instanceof Error && "status" in err && (err as { status?: number }).status === 423)
      ) {
        setErrorMsg("Account locked — too many failed attempts. Try again in 15 minutes.");
      } else if (
        (err instanceof Error && "status" in err && (err as { status?: number }).status === 429)
      ) {
        setErrorMsg("Too many attempts — please slow down and try again shortly.");
      } else if (
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("credentials") ||
        (err instanceof Error && "status" in err && (err as { status?: number }).status === 401)
      ) {
        setErrorMsg("Invalid email or password.");
      } else {
        setErrorMsg(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-8 space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access the admin dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@athenamd.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
          />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Keep me signed in for 30 days
          </Label>
        </div>

        {errorMsg && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMsg}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Need a staff account?{" "}
        <a
          href="mailto:it@athenamd.com"
          className="font-medium text-primary hover:underline"
        >
          Contact IT
        </a>
      </p>
    </motion.div>
  );
}
