"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Wordmark } from "@/components/wordmark";

export default function RootPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();

  React.useEffect(() => {
    if (!isReady) return;
    router.replace(user ? "/overview" : "/login");
  }, [isReady, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6">
      <Wordmark size="lg" />
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
