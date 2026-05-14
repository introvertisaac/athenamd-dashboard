"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  FlaskConical,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { RoleBadge } from "@/components/dashboard/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PATIENTS } from "@/lib/data";
import { cn, formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { user, clinicalAccess, setClinicalAccess } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [notifications, setNotifications] = React.useState({
    billing: true,
    flaggedLabs: true,
    newSignups: true,
    accountLocks: true,
    weeklyDigest: false,
  });

  const team = PATIENTS.filter((p) => p.role === "ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your admin account, workspace appearance, and notifications."
      />

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="profile">
            <UserCog className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="size-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="size-4" /> Team
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                This information is shown to other admins in the workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <PatientAvatar
                  name={user?.name ?? "Admin"}
                  color="#0f766e"
                  className="size-16 text-lg"
                />
                <div>
                  <Button variant="outline" size="sm">
                    Change avatar
                  </Button>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2 MB.
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" defaultValue={user?.name ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" defaultValue={user?.email ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue={user?.role ?? ""} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Job title</Label>
                  <Input id="title" defaultValue="Clinical Operations Lead" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Profile updated.")}>
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Choose how the admin dashboard looks on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = mounted && theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors",
                        active
                          ? "border-primary bg-accent/50"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-6",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Choose which operational events trigger an alert.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {[
                {
                  key: "billing" as const,
                  title: "Billing issues",
                  desc: "Payment failures and past-due subscriptions.",
                },
                {
                  key: "flaggedLabs" as const,
                  title: "Flagged lab markers",
                  desc: "When a patient uploads out-of-range results.",
                },
                {
                  key: "newSignups" as const,
                  title: "New signups",
                  desc: "When a new patient creates an account.",
                },
                {
                  key: "accountLocks" as const,
                  title: "Account locks",
                  desc: "When an account is locked after failed logins.",
                },
                {
                  key: "weeklyDigest" as const,
                  title: "Weekly digest",
                  desc: "A Monday summary of population health and growth.",
                },
              ].map((n) => (
                <div
                  key={n.key}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5 pr-4">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[n.key]}
                    onCheckedChange={(v) => {
                      setNotifications((s) => ({ ...s, [n.key]: v }));
                      toast.success(
                        `${n.title} notifications ${v ? "enabled" : "disabled"}.`,
                      );
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update the password for your admin account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new">New password</Label>
                  <Input id="new" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Password updated.")}>
                  Update password
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="size-4" />
                Clinical data access
              </CardTitle>
              <CardDescription>
                Health data — lab results, metabolic scores, tracking, protocols,
                and coach transcripts — is hidden by default. In production this
                is controlled by a medical-staff role; enable it here to preview
                those surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  Show clinical surfaces
                </p>
                <p className="text-sm text-muted-foreground">
                  Adds the Clinical Labs page and Health tabs on user profiles.
                </p>
              </div>
              <Switch
                checked={clinicalAccess}
                onCheckedChange={(v) => {
                  setClinicalAccess(v);
                  toast.success(
                    v
                      ? "Clinical data access enabled."
                      : "Clinical data access disabled.",
                  );
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Authenticator app</p>
                <p className="text-sm text-muted-foreground">
                  Use a TOTP app like 1Password or Authy.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => toast.success("2FA setup started (demo).")}
              >
                Enable 2FA
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active sessions</CardTitle>
              <CardDescription>
                Devices currently signed in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { device: "MacBook Pro · Chrome", loc: "San Francisco, CA", current: true },
                { device: "iPhone 16 · Safari", loc: "San Francisco, CA", current: false },
              ].map((s) => (
                <div
                  key={s.device}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {s.device}{" "}
                      {s.current && (
                        <span className="text-xs text-success">
                          · this device
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.loc}</p>
                  </div>
                  {!s.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success("Session revoked.")}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Admin team</CardTitle>
                <CardDescription>
                  Staff with access to the MetaboAI admin dashboard.
                </CardDescription>
              </div>
              <Button
                onClick={() => toast.success("Invite sent (demo).")}
              >
                Invite admin
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {team.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <PatientAvatar name={m.name} color={m.avatarColor} />
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      Joined {formatDate(m.createdAt)}
                    </span>
                    <RoleBadge role={m.role} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <PatientAvatar name={user?.name ?? "You"} color="#0f766e" />
                <div>
                  <p className="text-sm font-semibold">
                    {user?.name}{" "}
                    <span className="text-xs text-muted-foreground">(you)</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <RoleBadge role="ADMIN" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
