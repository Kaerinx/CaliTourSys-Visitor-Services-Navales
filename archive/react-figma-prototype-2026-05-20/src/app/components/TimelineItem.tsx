import { formatDateTime } from "../../lib/utils";
import { cn } from "../../lib/utils";

interface TimelineItemProps {
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: string;
  isLast?: boolean;
  variant?: "default" | "success" | "warning" | "error";
}

export function TimelineItem({
  title,
  description,
  timestamp,
  user,
  isLast,
  variant = "default",
}: TimelineItemProps) {
  const dotColors = {
    default: "bg-[var(--color-gov-blue)]",
    success: "bg-[var(--status-approved)]",
    warning: "bg-[var(--status-revision)]",
    error: "bg-[var(--status-rejected)]",
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "size-3 rounded-full shrink-0",
            dotColors[variant]
          )}
        />
        {!isLast && (
          <div className="w-0.5 h-full bg-border mt-1" />
        )}
      </div>

      <div className="flex-1 pb-6">
        <p className="font-medium mb-0.5">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mb-1">{description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDateTime(timestamp)}</span>
          {user && (
            <>
              <span>•</span>
              <span>{user}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
