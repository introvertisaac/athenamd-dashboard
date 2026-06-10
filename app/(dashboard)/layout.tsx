"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Wordmark } from "@/components/wordmark";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isReady } = useAuth();

  React.useEffect(() => {
    if (isReady && !user) router.replace("/login");
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6">
        <Wordmark size="lg" showImage />
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block">
          <SidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
