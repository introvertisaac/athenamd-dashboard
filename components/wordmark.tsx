import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * AthenaMD brand lockup.
 * - Default: the logo icon mark (DNA helix + "A") in a tile, with the
 *   "AthenaMD" wordmark text — "Athena" light navy, "MD" bold teal.
 * - `showImage`: renders the full stacked product logo PNG instead. Use this
 *   for centered brand moments (splash / loading) on light backgrounds.
 */
export function Wordmark({
  className,
  showText = true,
  showImage = false,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  showImage?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  if (showImage) {
    const logo = {
      sm: { w: 83, h: 80 },
      md: { w: 124, h: 120 },
      lg: { w: 166, h: 160 },
    }[size];
    return (
      <Image
        src="/athenamd_logo.png"
        alt="AthenaMD"
        width={logo.w}
        height={logo.h}
        className={cn("h-auto w-auto", className)}
      />
    );
  }

  const mark = {
    sm: "size-7 rounded-lg",
    md: "size-9 rounded-xl",
    lg: "size-11 rounded-xl",
  }[size];
  const icon = {
    sm: 20,
    md: 26,
    lg: 32,
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
          "flex items-center justify-center bg-white shadow-sm ring-1 ring-border",
          mark,
        )}
      >
        <Image
          src="/athenamd_icon.png"
          alt=""
          width={icon}
          height={icon}
          className="object-contain"
        />
      </div>
      {showText && (
        <span className={cn("tracking-tight", text)}>
          <span className="font-light text-brand">Athena</span>
          <span className="font-extrabold text-primary">MD</span>
          <span className="ml-1.5 align-text-top text-[0.6em] font-semibold uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </span>
      )}
    </div>
  );
}
