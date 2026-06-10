import { Activity, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(600px circle at 20% 10%, #47C9B855, transparent), radial-gradient(500px circle at 80% 90%, #3DBCAC55, transparent)",
          }}
        />
        <div className="relative">
          <Wordmark size="lg" className="[&_span]:text-primary-foreground [&_.text-primary]:text-primary-foreground" />
        </div>

        <div className="relative space-y-8">
          <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
            The clinical command center behind every AthenaMD patient.
          </h1>
          <ul className="space-y-4 text-sm text-primary-foreground/90">
            {[
              { icon: TrendingUp, text: "Monitor metabolic scores, labs, and engagement across your whole population." },
              { icon: ShieldCheck, text: "Manage accounts, roles, billing, and audit trails from one place." },
              { icon: Sparkles, text: "Review AI-generated protocols and coach conversations in context." },
              { icon: Activity, text: "Track sleep, nutrition, symptoms, and wearable integrations per patient." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <Icon className="size-4" />
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} AthenaMD, Inc. · For authorized clinical staff only.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
