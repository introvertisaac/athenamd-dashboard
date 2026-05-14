import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const mark = {
    sm: "size-7 rounded-lg [&_svg]:size-4",
    md: "size-9 rounded-xl [&_svg]:size-5",
    lg: "size-11 rounded-xl [&_svg]:size-6",
  }[size];
  const text = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-primary text-primary-foreground shadow-sm",
          mark,
        )}
      >
        <Activity strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", text)}>
          Metabo<span className="text-primary">AI</span>
          <span className="ml-1.5 align-text-top text-[0.6em] font-semibold uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </span>
      )}
    </div>
  );
}
