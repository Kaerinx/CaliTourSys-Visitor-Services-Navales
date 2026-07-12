import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge, ApplicationStatus } from "../StatusBadge";
import { TimelineItem } from "../TimelineItem";
import { Badge } from "../ui/badge";
import { ArrowLeft, Download, Upload, FileText, CheckCircle } from "lucide-react";
import { formatDate } from "../../../lib/utils";

interface ApplicationStatusDetailsProps {
  applicationId: string;
  onBack: () => void;
  onResubmit?: () => void;
}

export function ApplicationStatusDetails({ applicationId, onBack, onResubmit }: ApplicationStatusDetailsProps) {
  const application = {
    id: applicationId,
    businessName: "Sunset Beach Resort",
    type: "New Application",
    status: "under_review" as ApplicationStatus,
    submittedDate: "2026-05-10",
    estimatedCompletion: "2026-05-20",
  };

  const timeline = [
    {
      title: "Application Submitted",
      description: "Your application has been received by the Tourism Office",
      timestamp: "2026-05-10T09:30:00",
      user: "System",
      variant: "success" as const,
    },
    {
      title: "Initial Review Started",
      description: "Tourism staff began reviewing your application",
      timestamp: "2026-05-11T10:00:00",
      user: "Maria Santos (Tourism Staff)",
      variant: "default" as const,
    },
    {
      title: "Documents Verified",
      description: "Business Permit and DTI/SEC Registration verified successfully",
      timestamp: "2026-05-11T14:30:00",
      user: "Maria Santos (Tourism Staff)",
      variant: "success" as const,
    },
    {
      title: "Site Inspection Scheduled",
      description: "On-site inspection scheduled for May 15, 2026 at 10:00 AM",
      timestamp: "2026-05-12T09:00:00",
      user: "Juan Dela Cruz (Tourism Officer)",
      variant: "default" as const,
    },
  ];

  const documents = [
    {
      name: "Business Permit",
      description: "Current and valid business permit",
      status: "verified",
      uploadedDate: "2026-05-10",
    },
    {
      name: "DTI/SEC Registration",
      description: "DTI or SEC certificate of registration",
      status: "verified",
      uploadedDate: "2026-05-10",
    },
    {
      name: "Barangay Clearance",
      description: "Valid barangay clearance",
      status: "pending",
      uploadedDate: "2026-05-10",
    },
    {
      name: "Sanitary Permit",
      description: "Health permit from local health office",
      status: "verified",
      uploadedDate: "2026-05-10",
    },
  ];

  const remarks = [
    {
      author: "Maria Santos",
      role: "Tourism Staff",
      date: "2026-05-11",
      message: "All required documents are complete. Proceeding to site inspection.",
      type: "info",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Applications
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1>{application.id}</h1>
          <p className="text-muted-foreground mt-1">
            {application.businessName} • {application.type}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Submitted Date</p>
            <p className="font-medium">{formatDate(application.submittedDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Current Status</p>
            <p className="font-medium">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Est. Completion</p>
            <p className="font-medium">{formatDate(application.estimatedCompletion)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Timeline</CardTitle>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded bg-muted">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDate(doc.uploadedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "verified" ? (
                      <Badge variant="approved">
                        <CheckCircle className="size-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="pending">Pending</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff Remarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {remarks.map((remark, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{remark.author}</p>
                      <p className="text-xs text-muted-foreground">{remark.role}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(remark.date)}
                    </p>
                  </div>
                  <p className="text-sm">{remark.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {application.status === "for_revision" && onResubmit && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <p className="text-sm text-orange-900 mb-3">
                  Your application requires revisions. Please review the remarks and resubmit the required documents.
                </p>
                <Button variant="outline" className="w-full" onClick={onResubmit}>
                  <Upload className="size-4 mr-2" />
                  Resubmit Documents
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
