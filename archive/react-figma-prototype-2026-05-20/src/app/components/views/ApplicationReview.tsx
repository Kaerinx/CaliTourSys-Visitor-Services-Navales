import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { StatusBadge } from "../StatusBadge";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { ArrowLeft, CheckCircle, XCircle, FileEdit, Download, Eye, Building2, User, Mail, Phone } from "lucide-react";
import { formatDate } from "../../../lib/utils";

interface ApplicationReviewProps {
  applicationId: string;
  onBack: () => void;
}

type DocumentReviewStatus =
  | "Uploaded"
  | "Complete"
  | "Incomplete"
  | "Invalid"
  | "Needs Clarification";

export function ApplicationReview({ applicationId, onBack }: ApplicationReviewProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [remarks, setRemarks] = useState("");

  const application = {
    id: applicationId,
    businessName: "Sunset Beach Resort",
    owner: "John Martinez",
    type: "New Application",
    status: "under_review" as const,
    submittedDate: "2026-05-10",
    email: "john@sunsetresort.com",
    phone: "+63 912 345 6789",
    address: "123 Beach Road, Brgy. Coastal, Tourism City, Province",
    businessType: "Resort",
    dti: "123-456-789-012",
    businessPermitNumber: "BP-2026-004218",
    yearEstablished: "2020",
    description: "A beachfront resort offering luxury accommodations, water sports activities, and fine dining experiences.",
  };

  const [documents, setDocuments] = useState([
    { name: "Business Permit", status: "Complete" as DocumentReviewStatus, file: "business-permit.pdf", remarks: "" },
    { name: "DTI/SEC Registration", status: "Complete" as DocumentReviewStatus, file: "dti-sec-registration.pdf", remarks: "" },
    { name: "Barangay Clearance", status: "Needs Clarification" as DocumentReviewStatus, file: "barangay-clearance.pdf", remarks: "Upload the current-year clearance." },
    { name: "Sanitary Permit", status: "Complete" as DocumentReviewStatus, file: "sanitary.pdf", remarks: "" },
  ]);

  const canApprove = documents.every((document) => document.status === "Complete");

  const updateDocumentStatus = (
    name: string,
    status: DocumentReviewStatus
  ) => {
    setDocuments((current) =>
      current.map((document) =>
        document.name === name ? { ...document, status } : document
      )
    );
  };

  const updateDocumentRemarks = (name: string, remarks: string) => {
    setDocuments((current) =>
      current.map((document) =>
        document.name === name ? { ...document, remarks } : document
      )
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Applications
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1>Application Review</h1>
          <p className="text-muted-foreground mt-1">
            {application.id} • {application.businessName}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Business Name</p>
                  <p className="font-medium">{application.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Business Type</p>
                  <p className="font-medium">{application.businessType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">DTI Number</p>
                  <p className="font-medium">{application.dti}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Business Permit Number</p>
                  <p className="font-medium">{application.businessPermitNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Year Established</p>
                  <p className="font-medium">{application.yearEstablished}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{application.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="text-sm">{application.address}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{application.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{application.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{application.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submitted Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.name} className="p-3 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.file}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={doc.status}
                        onChange={(event) =>
                          updateDocumentStatus(
                            doc.name,
                            event.target.value as DocumentReviewStatus
                          )
                        }
                        className="w-44"
                      >
                        <option value="Uploaded">Uploaded</option>
                        <option value="Complete">Complete</option>
                        <option value="Incomplete">Incomplete</option>
                        <option value="Invalid">Invalid</option>
                        <option value="Needs Clarification">Needs Clarification</option>
                      </Select>
                      {doc.status === "Complete" ? (
                        <Badge variant="approved">Complete</Badge>
                      ) : (
                        <Badge variant="revision">Action Needed</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="size-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {doc.status !== "Complete" && (
                    <Textarea
                      rows={2}
                      placeholder="Required remarks for incomplete, invalid, or unclear documents"
                      value={doc.remarks}
                      onChange={(event) =>
                        updateDocumentRemarks(doc.name, event.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your review comments or feedback for this application..."
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => setShowApproveDialog(true)}
                disabled={!canApprove}
              >
                <CheckCircle className="size-4 mr-2" />
                Approve Application
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRevisionDialog(true)}
              >
                <FileEdit className="size-4 mr-2" />
                Request Revision
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="size-4 mr-2" />
                Reject Application
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-sm text-blue-900">
              Review all documents and information carefully before making a decision. Your decision will be sent to the business owner.
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent onClose={() => setShowApproveDialog(false)}>
          <DialogHeader>
            <div className="flex items-center justify-center size-16 rounded-full bg-green-100 text-green-600 mx-auto mb-4">
              <CheckCircle className="size-8" />
            </div>
            <DialogTitle>Approve Application?</DialogTitle>
            <DialogDescription className="text-center">
              You are about to approve this application. The business owner will be notified and accreditation will be issued.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowApproveDialog(false);
              onBack();
            }}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent onClose={() => setShowRevisionDialog(false)}>
          <DialogHeader>
            <div className="flex items-center justify-center size-16 rounded-full bg-orange-100 text-orange-600 mx-auto mb-4">
              <FileEdit className="size-8" />
            </div>
            <DialogTitle>Request Revision?</DialogTitle>
            <DialogDescription className="text-center">
              The application will be sent back to the business owner for revisions. Make sure to add detailed remarks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => {
              setShowRevisionDialog(false);
              onBack();
            }}>
              Send for Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent onClose={() => setShowRejectDialog(false)}>
          <DialogHeader>
            <div className="flex items-center justify-center size-16 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <XCircle className="size-8" />
            </div>
            <DialogTitle>Reject Application?</DialogTitle>
            <DialogDescription className="text-center">
              This action will reject the application permanently. The business owner will be notified. Please ensure remarks are provided.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowRejectDialog(false);
              onBack();
            }}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
