import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red" | "gray";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-[var(--color-gov-blue)]",
    green: "bg-green-50 text-[var(--status-approved)]",
    orange: "bg-orange-50 text-[var(--status-revision)]",
    red: "bg-red-50 text-[var(--status-rejected)]",
    gray: "bg-gray-50 text-[var(--status-expired)]",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-semibold mb-2">{value}</p>
            {trend && (
              <p
                className={cn("text-sm", {
                  "text-[var(--status-approved)]": trend.isPositive,
                  "text-[var(--status-rejected)]": !trend.isPositive,
                })}
              >
                {trend.value}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center size-12 rounded-lg",
              colorClasses[color]
            )}
          >
            <Icon className="size-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
