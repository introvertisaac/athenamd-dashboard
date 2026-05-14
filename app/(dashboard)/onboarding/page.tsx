"use client";

import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PatientAvatar } from "@/components/dashboard/patient-avatar";
import { SingleBarChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GOAL_LABELS,
  getOnboardingSurveys,
  getPatient,
  integrationName,
} from "@/lib/data";
import { formatDate } from "@/lib/utils";

const STEPS = [
  "Welcome",
  "About you",
  "Goal",
  "Symptoms",
  "Integrations",
  "Lab upload",
  "Complete",
];

export default function OnboardingPage() {
  const router = useRouter();
  const surveys = getOnboardingSurveys();
  const completed = surveys.filter((s) => s.completedAt).length;
  const inProgress = surveys.length - completed;
  const completionRate = Math.round((completed / surveys.length) * 100);

  // funnel: how many reached at least step N
  const funnel = STEPS.map((label, i) => ({
    step: label,
    reached: surveys.filter((s) => s.stepReached >= i + 1).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        description="Survey completion funnel and per-patient onboarding state."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total surveys"
          value={surveys.length}
          icon={ClipboardList}
        />
        <StatCard
          index={1}
          label="Completed"
          value={completed}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          index={2}
          label="In progress"
          value={inProgress}
          icon={Clock}
          accent="warning"
        />
        <StatCard
          index={3}
          label="Completion rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          delta={4}
          accent="info"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding funnel</CardTitle>
          <CardDescription>
            Patients reaching each step of the 7-step survey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SingleBarChart
            data={funnel}
            xKey="step"
            dataKey="reached"
            color="var(--chart-1)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Survey responses</CardTitle>
          <CardDescription>
            Goals, reported symptoms, and integrations selected during onboarding
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Patient</TableHead>
                <TableHead>Primary goal</TableHead>
                <TableHead>Symptoms</TableHead>
                <TableHead>Integrations</TableHead>
                <TableHead>Lab upload</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="pr-5">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((s) => {
                const p = getPatient(s.patientId)!;
                return (
                  <TableRow
                    key={s.patientId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/patients/${s.patientId}`)}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <PatientAvatar
                          name={p.name}
                          color={p.avatarColor}
                          className="size-7 text-[0.65rem]"
                        />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {GOAL_LABELS[s.primaryGoal]}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.symptoms.slice(0, 2).map((sym) => (
                          <Badge key={sym} variant="secondary">
                            {sym}
                          </Badge>
                        ))}
                        {s.symptoms.length > 2 && (
                          <Badge variant="outline">
                            +{s.symptoms.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.integrations.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {s.integrations.map(integrationName).join(", ")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.labReportUploaded ? (
                        <Badge variant="success">Uploaded</Badge>
                      ) : (
                        <Badge variant="secondary">Skipped</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.completedAt ? (
                        <Badge variant="success">Complete</Badge>
                      ) : (
                        <Badge variant="warning">
                          Step {s.stepReached}/7
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-muted-foreground">
                      {s.completedAt ? formatDate(s.completedAt) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
