import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
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
import { Calendar, Download, Eye, FileText, Search } from "lucide-react";
import { formatDate } from "../../../lib/utils";

type AccreditationRecord = {
  id: string;
  businessName: string;
  owner: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: "active" | "expired";
  businessPermitNumber: string;
  dtiRegistrationNumber: string;
  address: string;
  email: string;
  phone: string;
  applicationId: string;
  approvedBy: string;
  approvalRemarks: string;
  renewalHistory: Array<{
    applicationId: string;
    type: string;
    issueDate: string;
    expiryDate: string;
    status: string;
  }>;
};

const verifiedDocuments = [
  "Business Permit",
  "DTI/SEC Registration",
  "Barangay Clearance",
  "Sanitary Permit",
];

const records: AccreditationRecord[] = [
  {
    id: "ACC-2026-045",
    businessName: "Sunset Beach Resort",
    owner: "John Martinez",
    type: "Resort",
    issueDate: "2026-05-01",
    expiryDate: "2027-05-01",
    status: "active",
    businessPermitNumber: "BP-2026-004218",
    dtiRegistrationNumber: "123-456-789-012",
    address: "123 Beach Road, Brgy. Coastal, Tourism City, Province",
    email: "john@sunsetresort.com",
    phone: "+63 912 345 6789",
    applicationId: "APP-2026-001",
    approvedBy: "Maria Santos",
    approvalRemarks: "All required documents were verified. Accreditation issued after satisfactory review.",
    renewalHistory: [
      {
        applicationId: "APP-2026-001",
        type: "New Application",
        issueDate: "2026-05-01",
        expiryDate: "2027-05-01",
        status: "Current",
      },
    ],
  },
  {
    id: "ACC-2026-044",
    businessName: "Mountain View Inn",
    owner: "Maria Garcia",
    type: "Inn",
    issueDate: "2026-04-28",
    expiryDate: "2027-04-28",
    status: "active",
    businessPermitNumber: "BP-2026-003912",
    dtiRegistrationNumber: "DTI-2021-77821",
    address: "45 Ridge Avenue, Brgy. Highland, Mountain City, Province",
    email: "maria@mountainviewinn.com",
    phone: "+63 917 222 4411",
    applicationId: "APP-2026-044",
    approvedBy: "Juan Dela Cruz",
    approvalRemarks: "Accommodation documents are complete and valid for the current accreditation period.",
    renewalHistory: [
      {
        applicationId: "APP-2026-044",
        type: "New Application",
        issueDate: "2026-04-28",
        expiryDate: "2027-04-28",
        status: "Current",
      },
    ],
  },
  {
    id: "ACC-2026-043",
    businessName: "City Heritage Hotel",
    owner: "Carlos Reyes",
    type: "Hotel",
    issueDate: "2026-04-15",
    expiryDate: "2027-04-15",
    status: "active",
    businessPermitNumber: "BP-2026-003605",
    dtiRegistrationNumber: "SEC-2019-00458",
    address: "88 Heritage Street, Brgy. Centro, City Proper, Province",
    email: "admin@cityheritagehotel.com",
    phone: "+63 918 555 1040",
    applicationId: "APP-2026-043",
    approvedBy: "Maria Santos",
    approvalRemarks: "Hotel accreditation approved. Valid permits and business information are on file.",
    renewalHistory: [
      {
        applicationId: "APP-2026-043",
        type: "New Application",
        issueDate: "2026-04-15",
        expiryDate: "2027-04-15",
        status: "Current",
      },
    ],
  },
  {
    id: "ACC-2025-089",
    businessName: "Coastal Paradise Resort",
    owner: "Ana Santos",
    type: "Resort",
    issueDate: "2025-03-10",
    expiryDate: "2026-03-10",
    status: "expired",
    businessPermitNumber: "BP-2025-001882",
    dtiRegistrationNumber: "DTI-2018-30195",
    address: "7 Shoreline Road, Brgy. Baybay, Coastal Town, Province",
    email: "ana@coastalparadise.com",
    phone: "+63 919 300 7788",
    applicationId: "APP-2025-089",
    approvedBy: "Juan Dela Cruz",
    approvalRemarks: "Record expired. Business owner must submit a renewal application with updated documents.",
    renewalHistory: [
      {
        applicationId: "APP-2024-072",
        type: "New Application",
        issueDate: "2024-03-10",
        expiryDate: "2025-03-10",
        status: "Expired",
      },
      {
        applicationId: "APP-2025-089",
        type: "Renewal",
        issueDate: "2025-03-10",
        expiryDate: "2026-03-10",
        status: "Expired",
      },
    ],
  },
  {
    id: "ACC-2026-042",
    businessName: "Island Tours & Travel",
    owner: "Pedro Cruz",
    type: "Tour Operator",
    issueDate: "2026-04-05",
    expiryDate: "2027-04-05",
    status: "active",
    businessPermitNumber: "BP-2026-003144",
    dtiRegistrationNumber: "DTI-2022-11908",
    address: "21 Portside Avenue, Brgy. Ferry, Island City, Province",
    email: "pedro@islandtours.com",
    phone: "+63 916 444 9812",
    applicationId: "APP-2026-042",
    approvedBy: "Maria Santos",
    approvalRemarks: "Tour operation accreditation approved. Operator documents are complete and valid.",
    renewalHistory: [
      {
        applicationId: "APP-2026-042",
        type: "New Application",
        issueDate: "2026-04-05",
        expiryDate: "2027-04-05",
        status: "Current",
      },
    ],
  },
];

export function AccreditationRecords() {
  const [selectedRecord, setSelectedRecord] =
    useState<AccreditationRecord | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Accreditation Records</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all issued business accreditations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Active" value="186" className="text-[var(--color-gov-blue)]" />
        <SummaryCard label="Expiring Soon" value="12" className="text-orange-600" />
        <SummaryCard label="Expired" value="38" className="text-gray-600" />
        <SummaryCard label="This Month" value="15" className="text-green-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Records</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select defaultValue="all">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </Select>
              <Button variant="outline">
                <Download className="size-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accreditation ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.businessName}</TableCell>
                  <TableCell>{record.owner}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <DateCell date={record.issueDate} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <DateCell date={record.expiryDate} />
                  </TableCell>
                  <TableCell>
                    {record.status === "active" ? (
                      <Badge variant="approved">Active</Badge>
                    ) : (
                      <Badge variant="expired">Expired</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
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

      <AccreditationRecordDialog
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

function AccreditationRecordDialog({
  record,
  onClose,
}: {
  record: AccreditationRecord | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      {record && (
        <DialogContent
          className="max-w-6xl w-[92vw] max-h-[86vh] overflow-y-auto"
          onClose={onClose}
        >
          <DialogHeader>
            <DialogTitle>{record.businessName}</DialogTitle>
            <DialogDescription>{record.id} - Accreditation record</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
              {record.status === "active" ? (
                <Badge variant="approved">Active</Badge>
              ) : (
                <Badge variant="expired">Expired</Badge>
              )}
              <Badge variant="secondary">{record.type}</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
              <div className="space-y-5">
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Record Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem label="Owner" value={record.owner} />
                    <DetailItem label="Application" value={record.applicationId} />
                    <DetailItem label="Issued" value={formatDate(record.issueDate)} />
                    <DetailItem label="Valid Until" value={formatDate(record.expiryDate)} />
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem label="Type" value={record.type} />
                    <DetailItem label="Contact" value={record.phone} />
                    <DetailItem label="Email" value={record.email} />
                    <DetailItem label="Address" value={record.address} />
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Registration Numbers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem label="Business Permit No." value={record.businessPermitNumber} />
                    <DetailItem label="DTI/SEC Registration No." value={record.dtiRegistrationNumber} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold">Approval Note</h3>
                  <p className="text-sm">{record.approvalRemarks}</p>
                  <p className="text-xs text-muted-foreground">
                    Approved by {record.approvedBy}
                  </p>
                </section>
              </div>

              <div className="space-y-5">
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Submitted Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {verifiedDocuments.map((document) => (
                      <div
                        key={document}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{document}</span>
                        </div>
                        <Badge variant="approved">Verified</Badge>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Renewal History</h3>
                  <div className="space-y-2">
                    {record.renewalHistory.map((history) => (
                      <div
                        key={history.applicationId}
                        className="grid grid-cols-1 gap-2 rounded-lg border border-border px-3 py-2 text-sm md:grid-cols-2"
                      >
                        <DetailItem label="Application" value={history.applicationId} />
                        <DetailItem label="Type" value={history.type} />
                        <DetailItem
                          label="Validity"
                          value={`${formatDate(history.issueDate)} - ${formatDate(
                            history.expiryDate
                          )}`}
                        />
                        <DetailItem label="Status" value={history.status} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              <Download className="size-4 mr-2" />
              Download Record
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className={`text-3xl font-semibold mb-1 ${className}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function DateCell({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-1">
      <Calendar className="size-3" />
      {formatDate(date)}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
