import { StatCard } from "../StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge } from "../StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import {
  FileText,
  Clock,
  CheckCircle,
  FileEdit,
  Search,
  Filter,
  Eye,
} from "lucide-react";

interface TourismStaffDashboardProps {
  onNavigate: (view: string) => void;
  onViewReview?: (id: string) => void;
}

export function TourismStaffDashboard({
  onNavigate,
  onViewReview,
}: TourismStaffDashboardProps) {
  const pendingApplications = [
    {
      id: "APP-2026-001",
      businessName: "Sunset Beach Resort",
      owner: "John Martinez",
      type: "New Application",
      status: "under_review" as const,
      submittedDate: "2026-05-10",
      priority: "High",
    },
    {
      id: "APP-2026-002",
      businessName: "City Heritage Hotel",
      owner: "Maria Garcia",
      type: "Renewal",
      status: "pending" as const,
      submittedDate: "2026-05-12",
      priority: "Medium",
    },
    {
      id: "APP-2026-003",
      businessName: "Island Paradise Tours",
      owner: "Carlos Reyes",
      type: "New Application",
      status: "for_revision" as const,
      submittedDate: "2026-05-08",
      priority: "High",
    },
    {
      id: "APP-2026-004",
      businessName: "Lakeside Café & Inn",
      owner: "Ana Santos",
      type: "Renewal",
      status: "under_review" as const,
      submittedDate: "2026-05-13",
      priority: "Low",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Tourism Staff Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage business accreditation applications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Review"
          value="12"
          icon={Clock}
          trend={{ value: "+3 this week", isPositive: false }}
          color="orange"
        />
        <StatCard
          title="Under Review"
          value="8"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Approved Today"
          value="5"
          icon={CheckCircle}
          trend={{ value: "+2 from yesterday", isPositive: true }}
          color="green"
        />
        <StatCard
          title="For Revision"
          value="3"
          icon={FileEdit}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Applications Queue</CardTitle>
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
                <option value="for_revision">For Revision</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.id}</TableCell>
                  <TableCell>{app.businessName}</TableCell>
                  <TableCell>{app.owner}</TableCell>
                  <TableCell>{app.type}</TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(app.submittedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        app.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : app.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {app.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReview ? onViewReview(app.id) : onNavigate("review")}
                    >
                      <Eye className="size-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
