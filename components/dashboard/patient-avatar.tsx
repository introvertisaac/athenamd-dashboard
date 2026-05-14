import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PatientAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback
        style={{ backgroundColor: `${color}1f`, color }}
        className="font-semibold"
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
