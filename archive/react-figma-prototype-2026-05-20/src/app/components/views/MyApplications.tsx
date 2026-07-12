import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { StatusBadge } from "../StatusBadge";
import { Search, Eye, Plus } from "lucide-react";
import { formatDate } from "../../../lib/utils";
import { businessOwnerApplications } from "../../data/businessOwnerApplications";

interface MyApplicationsProps {
  onViewDetails: (id: string) => void;
  onNewApplication: () => void;
}

export function MyApplications({ onViewDetails, onNewApplication }: MyApplicationsProps) {
  const applications = businessOwnerApplications;
  const approvedCount = applications.filter(
    (app) => app.status === "approved"
  ).length;
  const underReviewCount = applications.filter(
    (app) => app.status === "under_review"
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>My Applications</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your accreditation applications
          </p>
        </div>
        <Button onClick={onNewApplication}>
          <Plus className="size-4 mr-2" />
          New Application
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Applications</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select defaultValue="all">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="for_revision">For Revision</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-border rounded-lg p-6 hover:bg-accent transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="mb-1">{app.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {app.businessName}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Type</p>
                        <p className="text-sm font-medium">{app.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                        <p className="text-sm font-medium">
                          {formatDate(app.submittedDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Update</p>
                        <p className="text-sm font-medium">
                          {formatDate(app.lastUpdate)}
                        </p>
                      </div>
                      {app.validUntil && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                          <p className="text-sm font-medium">
                            {formatDate(app.validUntil)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onViewDetails(app.id)}
                    >
                      <Eye className="size-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-semibold mb-1">
              {applications.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-semibold text-[var(--status-approved)] mb-1">
              {approvedCount}
            </p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-semibold text-[var(--status-review)] mb-1">
              {underReviewCount}
            </p>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
