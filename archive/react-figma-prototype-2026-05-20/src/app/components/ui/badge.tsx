import * as React from "react";
import { cn } from "../../../lib/utils";

export type BadgeVariant =
  | "approved"
  | "rejected"
  | "revision"
  | "review"
  | "pending"
  | "expired"
  | "default";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
          {
            "bg-[var(--status-approved-bg)] text-[var(--status-approved)]":
              variant === "approved",
            "bg-[var(--status-rejected-bg)] text-[var(--status-rejected)]":
              variant === "rejected",
            "bg-[var(--status-revision-bg)] text-[var(--status-revision)]":
              variant === "revision",
            "bg-[var(--status-review-bg)] text-[var(--status-review)]":
              variant === "review",
            "bg-[var(--status-pending-bg)] text-[var(--status-pending)]":
              variant === "pending",
            "bg-[var(--status-expired-bg)] text-[var(--status-expired)]":
              variant === "expired",
            "bg-secondary text-secondary-foreground": variant === "default",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
