import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Search,
  Shield,
} from "lucide-react";
import { formatDateTime } from "../../../lib/utils";

type AuditSeverity = "low" | "medium" | "high";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  module: string;
  severity: AuditSeverity;
  reference: string;
  outcome: string;
  ipAddress: string;
  device: string;
  details: string;
  recommendedAction: string;
}

const logs: AuditLog[] = [
  {
    id: "AUD-2026-1057",
    timestamp: "2026-05-14T16:45:00",
    actor: "Admin User",
    role: "System Administrator",
    action: "Updated role permissions",
    module: "Role Management",
    severity: "medium",
    reference: "ROLE-TOURISM-STAFF",
    outcome: "Permissions saved successfully",
    ipAddress: "192.168.10.24",
    device: "Chrome on Windows",
    details:
      "The System Administrator updated Tourism Staff permissions for application review, reports access, and accreditation records.",
    recommendedAction:
      "Review the changed permissions and confirm they match the intended staff responsibilities.",
  },
  {
    id: "AUD-2026-1056",
    timestamp: "2026-05-14T15:20:00",
    actor: "Maria Santos",
    role: "Tourism Staff",
    action: "Approved APP-2026-001",
    module: "Application Review",
    severity: "low",
    reference: "APP-2026-001",
    outcome: "Accreditation approved",
    ipAddress: "192.168.10.18",
    device: "Edge on Windows",
    details:
      "The application review was completed and an accreditation record was issued for the business owner.",
    recommendedAction:
      "No immediate action needed. Keep this event for compliance tracking.",
  },
  {
    id: "AUD-2026-1055",
    timestamp: "2026-05-14T13:05:00",
    actor: "Ana Reyes",
    role: "Tourism Staff",
    action: "Failed login attempt",
    module: "Authentication",
    severity: "high",
    reference: "USER-STAFF-004",
    outcome: "Login denied",
    ipAddress: "203.177.54.12",
    device: "Chrome on Android",
    details:
      "The account received an invalid password attempt. No session was created and no protected data was accessed.",
    recommendedAction:
      "If this repeats, contact the user and temporarily lock the account until access is verified.",
  },
  {
    id: "AUD-2026-1054",
    timestamp: "2026-05-14T10:30:00",
    actor: "John Martinez",
    role: "Business Owner",
    action: "Uploaded revised barangay clearance",
    module: "Document Upload",
    severity: "low",
    reference: "APP-2026-001",
    outcome: "Document received",
    ipAddress: "112.198.81.44",
    device: "Safari on iPhone",
    details:
      "A revised barangay clearance was uploaded after the application was returned for correction.",
    recommendedAction:
      "Tourism Staff should verify the revised document inside the application review flow.",
  },
];

export function AuditLogs() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const severityVariant = (severity: string) => {
    if (severity === "high") return "rejected" as const;
    if (severity === "medium") return "pending" as const;
    return "approved" as const;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1>Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track account, accreditation, and administration activity
          </p>
        </div>
        <Button variant="outline">
          <Download className="size-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Events Today</p>
            <p className="text-3xl font-semibold">42</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Security Alerts
                </p>
                <p className="text-3xl font-semibold text-red-600">3</p>
              </div>
              <AlertTriangle className="size-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Decisions Logged
                </p>
                <p className="text-3xl font-semibold text-green-600">18</p>
              </div>
              <CheckCircle className="size-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Admin Changes
                </p>
                <p className="text-3xl font-semibold text-blue-600">7</p>
              </div>
              <Shield className="size-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>System Activity</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select defaultValue="all">
                <option value="all">All Modules</option>
                <option value="authentication">Authentication</option>
                <option value="applications">Applications</option>
                <option value="documents">Documents</option>
                <option value="roles">Roles</option>
              </Select>
              <Select defaultValue="30">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.actor}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.role}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell>
                    <Badge variant={severityVariant(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <FileText className="size-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AuditLogDialog
        log={selectedLog}
        severityVariant={severityVariant}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

function AuditLogDialog({
  log,
  severityVariant,
  onClose,
}: {
  log: AuditLog | null;
  severityVariant: (severity: string) => "rejected" | "pending" | "approved";
  onClose: () => void;
}) {
  if (!log) {
    return null;
  }

  return (
    <Dialog open={Boolean(log)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-5xl w-[92vw] max-h-[86vh] overflow-y-auto"
        onClose={onClose}
      >
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            {log.id} - {formatDateTime(log.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <Badge variant={severityVariant(log.severity)}>{log.severity}</Badge>
            <Badge variant="secondary">{log.module}</Badge>
            <span className="text-sm text-muted-foreground">{log.outcome}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            <section className="space-y-3">
              <h3 className="text-base font-semibold">Event Summary</h3>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <DetailItem label="Action" value={log.action} />
                <DetailItem label="Reference" value={log.reference} />
                <DetailItem label="Details" value={log.details} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold">Actor and Access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem label="Actor" value={log.actor} />
                <DetailItem label="Role" value={log.role} />
                <DetailItem label="IP Address" value={log.ipAddress} />
                <DetailItem label="Device" value={log.device} />
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-border bg-gray-50 p-4">
            <h3 className="text-base font-semibold mb-2">Recommended Action</h3>
            <p className="text-sm text-muted-foreground">
              {log.recommendedAction}
            </p>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Download className="size-4 mr-2" />
            Download Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium leading-relaxed">{value}</p>
    </div>
  );
}
