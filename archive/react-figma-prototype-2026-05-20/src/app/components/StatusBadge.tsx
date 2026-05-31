import { Badge } from "./ui/badge";
import { CheckCircle, XCircle, Clock, FileEdit, AlertCircle, Ban } from "lucide-react";

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "for_revision"
  | "approved"
  | "rejected"
  | "expired";

interface StatusBadgeProps {
  status: ApplicationStatus;
  showIcon?: boolean;
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "pending" as const,
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    variant: "review" as const,
    icon: AlertCircle,
  },
  for_revision: {
    label: "For Revision",
    variant: "revision" as const,
    icon: FileEdit,
  },
  approved: {
    label: "Approved",
    variant: "approved" as const,
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    variant: "rejected" as const,
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    variant: "expired" as const,
    icon: Ban,
  },
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      {showIcon && <Icon className="size-3.5" />}
      <span>{config.label}</span>
    </Badge>
  );
}
