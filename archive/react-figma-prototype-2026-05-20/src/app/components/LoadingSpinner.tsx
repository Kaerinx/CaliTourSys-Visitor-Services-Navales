import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2
        className={cn(
          "animate-spin text-[var(--color-gov-blue)]",
          {
            "size-4": size === "sm",
            "size-6": size === "md",
            "size-8": size === "lg",
          },
          className
        )}
      />
    </div>
  );
}
