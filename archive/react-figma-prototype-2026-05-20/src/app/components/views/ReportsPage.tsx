import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Download, TrendingUp, FileText, Eye } from "lucide-react";

type RecentReport = {
  id: string;
  title: string;
  date: string;
  type: string;
  period: string;
  generatedBy: string;
  summary: {
    applications: number;
    approved: number;
    rejected: number;
    pending: number;
    averageProcessingDays: number;
  };
  highlights: string[];
  businessTypes: Array<{ label: string; value: number }>;
};

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<RecentReport | null>(
    null
  );

  const monthlyData = [
    { month: "Jan", applications: 45, approved: 38, rejected: 5, pending: 2 },
    { month: "Feb", applications: 52, approved: 43, rejected: 6, pending: 3 },
    { month: "Mar", applications: 48, approved: 40, rejected: 4, pending: 4 },
    { month: "Apr", applications: 61, approved: 52, rejected: 7, pending: 2 },
    { month: "May", applications: 38, approved: 25, rejected: 3, pending: 10 },
  ];

  const statusData = [
    { name: "Approved", value: 198, color: "#22c55e" },
    { name: "Pending", value: 21, color: "#eab308" },
    { name: "Rejected", value: 25, color: "#ef4444" },
    { name: "Under Review", value: 12, color: "#3b82f6" },
  ];

  const businessTypeData = [
    { type: "Resort", count: 45 },
    { type: "Hotel", count: 38 },
    { type: "Inn", count: 32 },
    { type: "Tour Operator", count: 28 },
    { type: "Restaurant", count: 25 },
    { type: "Transport", count: 18 },
  ];

  const recentReports: RecentReport[] = [
    {
      id: "RPT-2026-05",
      title: "May 2026 Monthly Report",
      date: "2026-05-14",
      type: "Monthly",
      period: "May 1-14, 2026",
      generatedBy: "Maria Santos",
      summary: {
        applications: 38,
        approved: 25,
        rejected: 3,
        pending: 10,
        averageProcessingDays: 5.2,
      },
      highlights: [
        "Application volume is up 12% compared with the previous month.",
        "Most approved applications came from accommodation establishments.",
        "Pending workload is concentrated in document verification.",
      ],
      businessTypes: [
        { label: "Resort", value: 12 },
        { label: "Hotel", value: 9 },
        { label: "Tour Operator", value: 7 },
        { label: "Restaurant", value: 6 },
      ],
    },
    {
      id: "RPT-2026-Q2",
      title: "Q2 2026 Quarterly Report",
      date: "2026-05-01",
      type: "Quarterly",
      period: "April 1-May 1, 2026",
      generatedBy: "Juan Dela Cruz",
      summary: {
        applications: 99,
        approved: 77,
        rejected: 10,
        pending: 12,
        averageProcessingDays: 5.6,
      },
      highlights: [
        "Approval rate remains above 75% for the quarter to date.",
        "Renewal submissions increased as several records approached expiry.",
        "Rejected applications were mostly caused by incomplete permits.",
      ],
      businessTypes: [
        { label: "Resort", value: 28 },
        { label: "Hotel", value: 22 },
        { label: "Inn", value: 18 },
        { label: "Tour Operator", value: 15 },
      ],
    },
    {
      id: "RPT-2026-04",
      title: "April 2026 Monthly Report",
      date: "2026-04-30",
      type: "Monthly",
      period: "April 1-30, 2026",
      generatedBy: "Maria Santos",
      summary: {
        applications: 61,
        approved: 52,
        rejected: 7,
        pending: 2,
        averageProcessingDays: 4.8,
      },
      highlights: [
        "April had the strongest monthly approval count in the current year.",
        "Average processing time improved to under 5 days.",
        "Only two applications remained pending at month end.",
      ],
      businessTypes: [
        { label: "Resort", value: 14 },
        { label: "Hotel", value: 13 },
        { label: "Inn", value: 10 },
        { label: "Restaurant", value: 8 },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          View insights and generate reports for business accreditation data
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Generate Report</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select defaultValue="monthly">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </Select>
              <Button>
                <Download className="size-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select>
                <option>Application Report</option>
                <option>Approved Accreditation Report</option>
                <option>Rejected Application Report</option>
                <option>Expired Accreditation Report</option>
                <option>Renewal Report</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" defaultValue="2026-05-01" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" defaultValue="2026-05-14" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select>
                <option>All Business Types</option>
                <option>Accommodation</option>
                <option>Restaurant</option>
                <option>Travel and Tour</option>
                <option>Souvenir Shop</option>
                <option>Transport Service</option>
                <option>Other Tourism-Related Business</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Application Status</Label>
              <Select>
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Under Review</option>
                <option>For Revision</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Expired</option>
                <option>Renewed</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Accreditation Type</Label>
              <Select>
                <option>All Types</option>
                <option>New Accreditation</option>
                <option>Renewal</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Evaluator</Label>
              <Select>
                <option>All Evaluators</option>
                <option>Maria Santos</option>
                <option>Juan Dela Cruz</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Decision Date</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Validity Period</Label>
              <Select>
                <option>All Validity Periods</option>
                <option>Active This Month</option>
                <option>Expiring in 30 Days</option>
                <option>Expired</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
                <p className="text-3xl font-semibold">244</p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  +12% from last month
                </p>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-semibold text-green-600">198</p>
                <p className="text-sm text-muted-foreground mt-1">81% approval rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                <p className="text-3xl font-semibold text-orange-600">21</p>
                <p className="text-sm text-muted-foreground mt-1">Awaiting action</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Processing Time</p>
                <p className="text-3xl font-semibold">5.2</p>
                <p className="text-sm text-muted-foreground mt-1">days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Applications Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar key="approved" dataKey="approved" fill="#22c55e" name="Approved" />
                <Bar key="rejected" dataKey="rejected" fill="#ef4444" name="Rejected" />
                <Bar key="pending" dataKey="pending" fill="#eab308" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications by Business Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={businessTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" width={120} />
              <Tooltip />
              <Bar key="count" dataKey="count" fill="#1e40af" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id}</TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell className="text-muted-foreground">{report.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="size-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReportViewDialog
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

function ReportViewDialog({
  report,
  onClose,
}: {
  report: RecentReport | null;
  onClose: () => void;
}) {
  if (!report) {
    return null;
  }

  return (
    <Dialog open={Boolean(report)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[88vh] overflow-y-auto"
        onClose={onClose}
      >
        <DialogHeader>
          <DialogTitle>{report.title}</DialogTitle>
          <DialogDescription>
            {report.id} - {report.period} - Generated by {report.generatedBy}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ReportMetric label="Applications" value={report.summary.applications} />
            <ReportMetric label="Approved" value={report.summary.approved} />
            <ReportMetric label="Rejected" value={report.summary.rejected} />
            <ReportMetric label="Pending" value={report.summary.pending} />
            <ReportMetric
              label="Avg. Days"
              value={report.summary.averageProcessingDays}
            />
          </div>

          <section className="space-y-2">
            <h3 className="text-base font-semibold">Key Findings</h3>
            <ul className="space-y-2">
              {report.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold">Top Business Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {report.businessTypes.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.value} applications
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Download className="size-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
