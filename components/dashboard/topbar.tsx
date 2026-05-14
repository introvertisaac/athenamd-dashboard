"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  LogOut,
  Menu,
  TrendingUp,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav } from "./sidebar-nav";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { initials, relativeTime } from "@/lib/utils";

const NOTIFICATIONS = [
  {
    icon: CreditCard,
    title: "Payment failed",
    body: "David Okonkwo's Premium subscription is past due — $49 MRR at risk.",
    time: 2,
    accent: "text-warning",
  },
  {
    icon: TrendingUp,
    title: "MRR milestone",
    body: "Monthly recurring revenue crossed $300 for the first time.",
    time: 6,
    accent: "text-success",
  },
  {
    icon: UserPlus,
    title: "New signup",
    body: "Tom Bradshaw created an account — onboarding incomplete.",
    time: 14,
    accent: "text-info",
  },
  {
    icon: UserCog,
    title: "Account locked",
    body: "James Sullivan was locked after 5 failed login attempts.",
    time: 28,
    accent: "text-warning",
  },
];

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <ThemeToggle />

      {/* Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive ring-2 ring-background" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <span className="text-xs text-muted-foreground">
              {NOTIFICATIONS.length} new
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {NOTIFICATIONS.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.title}
                  className="flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50"
                >
                  <Icon className={`mt-0.5 size-4 shrink-0 ${n.accent}`} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-snug">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="text-[0.7rem] text-muted-foreground/80">
                      {relativeTime(new Date(Date.now() - n.time * 3600_000))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/audit-logs"
            className="block border-t px-4 py-2.5 text-center text-xs font-semibold text-primary hover:underline"
          >
            View all activity
          </Link>
        </PopoverContent>
      </Popover>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent/40">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user ? initials(user.name) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-none">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-semibold text-foreground">
              {user?.name}
            </p>
            <p className="font-normal text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserCog /> Account settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
