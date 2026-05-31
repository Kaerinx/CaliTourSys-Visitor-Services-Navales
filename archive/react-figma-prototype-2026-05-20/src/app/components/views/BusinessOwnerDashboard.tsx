import { StatCard } from "../StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge } from "../StatusBadge";
import { TimelineItem } from "../TimelineItem";
import { formatDate } from "../../../lib/utils";
import { businessOwnerApplications } from "../../data/businessOwnerApplications";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Building2,
} from "lucide-react";

interface BusinessOwnerDashboardProps {
  onNavigate: (view: string) => void;
  onViewDetails?: (id: string) => void;
}

export function BusinessOwnerDashboard({
  onNavigate,
  onViewDetails,
}: BusinessOwnerDashboardProps) {
  const applications = businessOwnerApplications;
  const recentApplications = [...applications]
    .sort(
      (first, second) =>
        new Date(second.submittedDate).getTime() -
        new Date(first.submittedDate).getTime()
    )
    .slice(0, 2);
  const approvedCount = applications.filter(
    (app) => app.status === "approved"
  ).length;
  const underReviewCount = applications.filter(
    (app) => app.status === "under_review"
  ).length;
  const forRevisionCount = applications.filter(
    (app) => app.status === "for_revision"
  ).length;

  const timeline = [
    {
      title: "Application Submitted",
      description: "Your application for Sunset Beach Resort has been received",
      timestamp: "2026-05-10T09:30:00",
      user: "System",
      variant: "default" as const,
    },
    {
      title: "Under Review",
      description: "Tourism staff is reviewing your documents",
      timestamp: "2026-05-11T14:15:00",
      user: "Maria Santos",
      variant: "default" as const,
    },
    {
      title: "Document Verification",
      description: "All required documents are being verified",
      timestamp: "2026-05-12T10:00:00",
      user: "Juan Dela Cruz",
      variant: "default" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Welcome back!</h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your business accreditation status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applications"
          value={applications.length.toString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Approved"
          value={approvedCount.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Under Review"
          value={underReviewCount.toString()}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="For Revision"
          value={forRevisionCount.toString()}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("applications")}
            >
              View All
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() =>
                    onViewDetails
                      ? onViewDetails(app.id)
                      : onNavigate("applications")
                  }
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                      <Building2 className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">{app.businessName}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {app.id} • {app.type}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Submitted {formatDate(app.submittedDate)} • Updated{" "}
                        {formatDate(app.lastUpdate)}
                      </p>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {timeline.map((item, index) => (
                <TimelineItem
                  key={index}
                  title={item.title}
                  description={item.description}
                  timestamp={item.timestamp}
                  user={item.user}
                  variant={item.variant}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-[var(--color-gov-blue)] to-[var(--color-gov-blue-dark)] text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white mb-2">
                Ready to apply for accreditation?
              </h3>
              <p className="text-white/80 mb-4">
                Start your application process today and get your business
                accredited with LGU Tourism Office
              </p>
              <Button
                variant="secondary"
                onClick={() => onNavigate("apply")}
              >
                Start New Application
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
