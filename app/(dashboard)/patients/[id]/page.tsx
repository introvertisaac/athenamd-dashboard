"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Calendar,
  CreditCard,
  Droplets,
  Dumbbell,
  FileText,
  FlaskConical,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  Pill,
  Salad,
  ShieldAlert,
  Sparkles,
  Trash2,
  TriangleAlert,
  Unlock,
  UserCog,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  AccountStatusBadge,
  LabStatusBadge,
  OcrStatusBadge,
  RoleBadge,
  SubStatusBadge,
  TierBadge,
} from "@/components/dashboard/badges";
import {
  MultiLineChart,
  SingleBarChart,
} from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getConversations,
  getDocuments,
  getFood,
  getLabs,
  getLifestyle,
  getMedications,
  getPatient,
  getProtocol,
  getSleep,
  getSymptoms,
  labStatus,
  GOAL_LABELS,
  SEX_LABELS,
  ageFromDob,
  integrationName,
} from "@/lib/data";
import {
  cn,
  currency,
  formatDate,
  formatDateTime,
  relativeTime,
} from "@/lib/utils";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const patient = getPatient(params.id);
  const [functionalMode, setFunctionalMode] = React.useState(true);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (!patient) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Patient not found"
        description="This patient may have been deleted or the link is invalid."
      >
        <Button variant="outline" asChild>
          <Link href="/patients">Back to patients</Link>
        </Button>
      </EmptyState>
    );
  }

  const labs = getLabs(patient.id);
  const sleep = getSleep(patient.id);
  const symptoms = getSymptoms(patient.id);
  const food = getFood(patient.id);
  const lifestyle = getLifestyle(patient.id);
  const medications = getMedications(patient.id);
  const protocol = getProtocol(patient.id);
  const conversations = getConversations(patient.id);
  const documents = getDocuments(patient.id);

  const flaggedLabs = labs.filter((l) => l.flagged);
  const avgSleep =
    sleep.length > 0
      ? sleep.reduce((s, d) => s + d.totalHours, 0) / sleep.length
      : 0;
  const avgHrv =
    sleep.length > 0
      ? Math.round(sleep.reduce((s, d) => s + d.hrv, 0) / sleep.length)
      : 0;

  // score breakdown (derived)
  const breakdown = [
    { label: "Labs", value: Math.min(100, 100 - flaggedLabs.length * 12), icon: FlaskConical },
    { label: "Sleep", value: Math.round((avgSleep / 8) * 100), icon: Moon },
    { label: "Nutrition", value: 62 + (patient.metabolicScore % 30), icon: Utensils },
    { label: "Symptoms", value: Math.max(20, 100 - symptoms.length * 7), icon: TriangleAlert },
    { label: "Lifestyle", value: 55 + (patient.metabolicScore % 38), icon: Dumbbell },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.push("/patients")}
      >
        <ArrowLeft className="size-4" />
        All patients
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <PatientAvatar
                name={patient.name}
                color={patient.avatarColor}
                className="size-16 text-lg"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    {patient.name}
                  </h1>
                  <RoleBadge role={patient.role} />
                  <AccountStatusBadge status={patient.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {patient.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {patient.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {patient.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Joined{" "}
                    {formatDate(patient.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => toast.success(`Role editor opened for ${patient.name}.`)}
              >
                <UserCog className="size-4" />
                Change role
              </Button>
              {patient.status === "locked" ? (
                <Button
                  variant="outline"
                  onClick={() => toast.success(`${patient.name}'s account unlocked.`)}
                >
                  <Unlock className="size-4" />
                  Unlock
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => toast.success(`${patient.name}'s account locked.`)}
                >
                  <Lock className="size-4" />
                  Lock
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete patient"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="labs">
            Labs
            {flaggedLabs.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5">
                {flaggedLabs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
          <TabsTrigger value="coach">Coach</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* ───────── Overview ───────── */}
        <TabsContent value="overview" className="space-y-4">
          {!patient.onboardingComplete ? (
            <EmptyState
              icon={Sparkles}
              title="Onboarding not complete"
              description={`${patient.name} created an account but hasn't finished the onboarding survey, so no health data is available yet.`}
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Metabolic score</CardTitle>
                    <CardDescription>
                      {patient.scoreDelta >= 0 ? "+" : ""}
                      {patient.scoreDelta} pts vs last week
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-5">
                    <ScoreRing score={patient.metabolicScore} size={104} stroke={9} />
                    <div className="space-y-1.5 text-sm">
                      <p className="text-muted-foreground">
                        Primary goal
                      </p>
                      <p className="font-semibold">
                        {GOAL_LABELS[patient.primaryGoal]}
                      </p>
                      <p className="pt-1 text-muted-foreground">Flagged labs</p>
                      <p className="font-semibold text-destructive">
                        {flaggedLabs.length} markers
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Score breakdown</CardTitle>
                    <CardDescription>
                      Contribution of each health domain
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {breakdown.map((b) => {
                      const Icon = b.icon;
                      const v = Math.max(0, Math.min(100, b.value));
                      return (
                        <div key={b.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium">
                              <Icon className="size-4 text-muted-foreground" />
                              {b.label}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {v}/100
                            </span>
                          </div>
                          <Progress
                            value={v}
                            indicatorClassName={
                              v >= 70
                                ? "bg-success"
                                : v >= 40
                                  ? "bg-warning"
                                  : "bg-destructive"
                            }
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat
                  icon={Moon}
                  label="Avg sleep (14d)"
                  value={`${avgSleep.toFixed(1)} h`}
                />
                <MiniStat
                  icon={Sparkles}
                  label="Avg HRV (14d)"
                  value={`${avgHrv} ms`}
                />
                <MiniStat
                  icon={Utensils}
                  label="Food logs (4d)"
                  value={`${food.length}`}
                />
                <MiniStat
                  icon={Bot}
                  label="Coach chats"
                  value={`${conversations.length}`}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Profile & vitals</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Age" value={`${ageFromDob(patient.dateOfBirth)} years`} />
                  <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
                  <Field label="Biological sex" value={SEX_LABELS[patient.biologicalSex]} />
                  <Field label="Unit system" value={patient.unitSystem === "METRIC" ? "Metric" : "Imperial"} />
                  <Field label="Height" value={`${patient.heightCm} cm`} />
                  <Field label="Weight" value={`${patient.weightKg} kg`} />
                  <Field
                    label="BMI"
                    value={(
                      patient.weightKg /
                      (patient.heightCm / 100) ** 2
                    ).toFixed(1)}
                  />
                  <Field label="Timezone" value={patient.timezone} />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ───────── Labs ───────── */}
        <TabsContent value="labs" className="space-y-4">
          {labs.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No lab results"
              description="This patient hasn't uploaded or synced any lab panels yet."
            />
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      Reference ranges
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm",
                          !functionalMode
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        Conventional
                      </span>
                      <Switch
                        checked={functionalMode}
                        onCheckedChange={setFunctionalMode}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          functionalMode
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        Functional
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{labs.length} markers</span>
                    <span>·</span>
                    <span className="text-destructive">
                      {flaggedLabs.length} out of range
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5">Marker</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>
                          {functionalMode ? "Functional" : "Conventional"} range
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="pr-5">Collected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labs.map((l) => {
                        const status = labStatus(l);
                        const low = functionalMode
                          ? l.functionalLow
                          : l.conventionalLow;
                        const high = functionalMode
                          ? l.functionalHigh
                          : l.conventionalHigh;
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="pl-5 font-medium">
                              {l.marker}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {l.category}
                            </TableCell>
                            <TableCell className="font-semibold tabular-nums">
                              {l.value} {l.unit}
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {low} – {high} {l.unit}
                            </TableCell>
                            <TableCell>
                              <LabStatusBadge status={status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {l.source}
                            </TableCell>
                            <TableCell className="pr-5 text-muted-foreground">
                              {formatDate(l.collectedDate)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Uploaded documents</CardTitle>
                    <CardDescription>
                      Lab reports and scans, with OCR processing status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {d.originalFilename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.docType.replace("_", " ").toLowerCase()} ·{" "}
                            {(d.sizeKb / 1024).toFixed(1)} MB · uploaded{" "}
                            {formatDate(d.uploadedAt)}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <OcrStatusBadge status={d.ocrStatus} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ───────── Tracking ───────── */}
        <TabsContent value="tracking">
          {!patient.onboardingComplete ? (
            <EmptyState
              icon={Moon}
              title="No tracking data"
              description="Health logs appear once the patient completes onboarding and starts logging."
            />
          ) : (
            <Tabs defaultValue="sleep" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
                <TabsTrigger value="sleep">
                  <Moon className="size-4" /> Sleep
                </TabsTrigger>
                <TabsTrigger value="symptoms">
                  <TriangleAlert className="size-4" /> Symptoms
                </TabsTrigger>
                <TabsTrigger value="nutrition">
                  <Utensils className="size-4" /> Nutrition
                </TabsTrigger>
                <TabsTrigger value="lifestyle">
                  <Dumbbell className="size-4" /> Lifestyle
                </TabsTrigger>
                <TabsTrigger value="meds">
                  <Pill className="size-4" /> Medications
                </TabsTrigger>
              </TabsList>

              {/* Sleep */}
              <TabsContent value="sleep" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sleep & recovery — last 14 nights</CardTitle>
                    <CardDescription>
                      Total sleep hours, HRV, and readiness trend
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MultiLineChart
                      data={sleep.map((s) => ({
                        date: formatDate(s.date, { month: "short", day: "numeric" }),
                        hours: s.totalHours,
                        hrv: s.hrv,
                        readiness: s.readiness,
                      }))}
                      xKey="date"
                      series={[
                        { key: "hrv", color: "var(--chart-1)" },
                        { key: "readiness", color: "var(--chart-4)" },
                      ]}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-5">Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Deep</TableHead>
                          <TableHead>REM</TableHead>
                          <TableHead>Light</TableHead>
                          <TableHead>HRV</TableHead>
                          <TableHead className="pr-5">Readiness</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...sleep].reverse().map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="pl-5 font-medium">
                              {formatDate(s.date)}
                            </TableCell>
                            <TableCell className="font-semibold tabular-nums">
                              {s.totalHours} h
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {s.deepHours} h
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {s.remHours} h
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {s.lightHours} h
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {s.hrv} ms
                            </TableCell>
                            <TableCell className="pr-5">
                              <Badge
                                variant={
                                  s.readiness >= 70
                                    ? "success"
                                    : s.readiness >= 50
                                      ? "warning"
                                      : "destructive"
                                }
                              >
                                {s.readiness}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Symptoms */}
              <TabsContent value="symptoms" className="space-y-3">
                {symptoms.length === 0 ? (
                  <EmptyState
                    icon={TriangleAlert}
                    title="No symptoms logged"
                  />
                ) : (
                  symptoms.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {s.symptoms.map((sym) => (
                              <Badge key={sym} variant="secondary">
                                {sym}
                              </Badge>
                            ))}
                          </div>
                          {s.notes && (
                            <p className="text-sm text-muted-foreground">
                              “{s.notes}”
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              s.severity === "severe"
                                ? "destructive"
                                : s.severity === "moderate"
                                  ? "warning"
                                  : "success"
                            }
                            className="capitalize"
                          >
                            {s.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(s.date)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Nutrition */}
              <TabsContent value="nutrition" className="space-y-4">
                {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const).map(
                  (meal) => {
                    const items = food.filter(
                      (f) => f.mealType === meal && f.date === food[0]?.date,
                    );
                    const today = food
                      .filter((f) => f.mealType === meal)
                      .slice(0, 1);
                    const list = items.length ? items : today;
                    if (list.length === 0) return null;
                    return (
                      <Card key={meal}>
                        <CardHeader>
                          <CardTitle className="capitalize">
                            {meal.toLowerCase()}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {list.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                  <Salad className="size-4" />
                                </span>
                                <div>
                                  <p className="text-sm font-medium">
                                    {f.foodName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(f.date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {f.calories} kcal
                                </span>
                                <span>P {f.protein}g</span>
                                <span>C {f.carbs}g</span>
                                <span>F {f.fat}g</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  },
                )}
              </TabsContent>

              {/* Lifestyle */}
              <TabsContent value="lifestyle" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stress & hydration — last 7 days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SingleBarChart
                      data={lifestyle.map((l) => ({
                        date: formatDate(l.date, {
                          month: "short",
                          day: "numeric",
                        }),
                        stress: l.stressLevel,
                      }))}
                      xKey="date"
                      dataKey="stress"
                      color="var(--chart-4)"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-5">Date</TableHead>
                          <TableHead>Stress</TableHead>
                          <TableHead>Water</TableHead>
                          <TableHead>Exercise</TableHead>
                          <TableHead>Effort</TableHead>
                          <TableHead className="pr-5">Alcohol</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...lifestyle].reverse().map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="pl-5 font-medium">
                              {formatDate(l.date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  l.stressLevel >= 4
                                    ? "destructive"
                                    : l.stressLevel >= 3
                                      ? "warning"
                                      : "success"
                                }
                              >
                                {l.stressLevel}/5
                              </Badge>
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Droplets className="size-3.5" />
                                {(l.waterMl / 1000).toFixed(1)} L
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {l.exerciseType}
                              {l.exerciseMinutes > 0 &&
                                ` · ${l.exerciseMinutes}m`}
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {l.exerciseMinutes > 0 ? l.exerciseEffort : "—"}
                            </TableCell>
                            <TableCell className="pr-5 text-muted-foreground">
                              {l.alcoholDrinks > 0
                                ? `${l.alcoholDrinks} drink${l.alcoholDrinks > 1 ? "s" : ""}`
                                : "None"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medications */}
              <TabsContent value="meds">
                {medications.length === 0 ? (
                  <EmptyState
                    icon={Pill}
                    title="No medications"
                    description="This patient hasn't added any medications."
                  />
                ) : (
                  <Card>
                    <CardContent className="space-y-2">
                      {medications.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <span className="flex size-9 items-center justify-center rounded-lg bg-info/12 text-info">
                            <Pill className="size-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.dose} · {m.time} · {m.prescriber}
                            </p>
                          </div>
                          <Badge
                            variant={m.taken ? "success" : "secondary"}
                            className="ml-auto"
                          >
                            {m.taken ? "Taken today" : "Not taken"}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* ───────── Protocol ───────── */}
        <TabsContent value="protocol" className="space-y-4">
          {!protocol ? (
            <EmptyState
              icon={Sparkles}
              title="No protocol generated"
              description="An AI protocol is generated after the patient completes onboarding."
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Last updated {relativeTime(protocol.lastUpdated)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success("Protocol regeneration queued (demo).")
                  }
                >
                  <Sparkles className="size-4" />
                  Regenerate
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="size-4 text-primary" />
                    Supplement protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {protocol.supplements.map((s) => (
                    <div key={s.name} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{s.name}</p>
                        <Badge variant="accent">{s.timing}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.rationale}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Salad className="size-4 text-success" />
                      Dietary recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {protocol.dietary.map((d) => (
                      <div key={d.title} className="rounded-lg border p-3">
                        <p className="text-sm font-semibold">{d.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {d.rationale}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="size-4 text-info" />
                      Lifestyle recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {protocol.lifestyle.map((l) => (
                      <div key={l.title} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{l.title}</p>
                          {l.priority && (
                            <Badge
                              variant={
                                l.priority === "high"
                                  ? "destructive"
                                  : l.priority === "medium"
                                    ? "warning"
                                    : "secondary"
                              }
                              className="capitalize"
                            >
                              {l.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {l.rationale}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ───────── Coach ───────── */}
        <TabsContent value="coach" className="space-y-4">
          {conversations.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No coach conversations"
              description="This patient hasn't started a conversation with the AI coach yet."
            />
          ) : (
            conversations.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>
                    Started {formatDate(c.createdAt)} · {c.messages.length}{" "}
                    messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex gap-3",
                        m.role === "user" && "flex-row-reverse",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground",
                        )}
                      >
                        {m.role === "user" ? "P" : <Bot className="size-4" />}
                      </span>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ───────── Account ───────── */}
        <TabsContent value="account" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account & security</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Field label="User ID" value={patient.id} mono />
                <Field label="Role" value={patient.role} />
                <Field
                  label="Email verified"
                  value={patient.emailVerified ? "Yes" : "No"}
                />
                <Field
                  label="Onboarding"
                  value={patient.onboardingComplete ? "Complete" : "Incomplete"}
                />
                <Field
                  label="Last login"
                  value={
                    patient.lastLoginAt
                      ? formatDateTime(patient.lastLoginAt)
                      : "Never"
                  }
                />
                <Field
                  label="Failed login attempts"
                  value={String(patient.failedLoginAttempts)}
                />
                <Field
                  label="Account created"
                  value={formatDate(patient.createdAt)}
                />
                <Field
                  label="Locked until"
                  value={
                    patient.lockedUntil
                      ? formatDateTime(patient.lockedUntil)
                      : "Not locked"
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <TierBadge tier={patient.subscription.tier} />
                  <SubStatusBadge status={patient.subscription.status} />
                  {patient.subscription.cancelAtPeriodEnd && (
                    <Badge variant="warning">Cancels at period end</Badge>
                  )}
                </div>
                <Separator />
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Field
                    label="MRR"
                    value={currency(patient.subscription.mrr)}
                  />
                  <Field
                    label="Started"
                    value={formatDate(patient.subscription.startedAt)}
                  />
                  <Field
                    label="Current period ends"
                    value={
                      patient.subscription.currentPeriodEnd
                        ? formatDate(patient.subscription.currentPeriodEnd)
                        : "—"
                    }
                  />
                  <Field
                    label="Stripe customer"
                    value={patient.subscription.stripeCustomerId ?? "—"}
                    mono
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toast.success("Opened Stripe billing portal (demo).")
                  }
                >
                  Manage in Stripe
                </Button>
              </CardContent>
            </Card>
          </div>

          {patient.connectedIntegrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected integrations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {patient.connectedIntegrations.map((id) => (
                  <Badge key={id} variant="outline" className="gap-1.5 py-1">
                    <span className="size-1.5 rounded-full bg-success" />
                    {integrationName(id)}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-4" />
                Danger zone
              </CardTitle>
              <CardDescription>
                Soft-deletes the patient and revokes all active sessions. This
                can be reversed by the platform team within 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete patient account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {patient.name}?</DialogTitle>
            <DialogDescription>
              This soft-deletes the account, marks the profile as deleted, and
              revokes all refresh tokens. The patient will be signed out of all
              devices immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                toast.error(`${patient.name} would be soft-deleted (demo).`);
              }}
            >
              <Trash2 className="size-4" />
              Delete patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Moon;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono text-xs")}>
        {value}
      </p>
    </div>
  );
}
