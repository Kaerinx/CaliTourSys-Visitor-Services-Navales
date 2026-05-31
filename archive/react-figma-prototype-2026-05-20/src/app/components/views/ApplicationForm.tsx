import { useState } from "react";
import { ProgressStepper } from "../ProgressStepper";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { FileUploadCard } from "../FileUploadCard";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";

interface ApplicationFormProps {
  onBack: () => void;
  onSubmit: (applicationNumber: string) => void;
  initialAccreditationType?: "New Accreditation" | "Renewal";
}

type DocumentStatus = "uploading" | "success" | "error" | "revision";

interface RequiredDocument {
  title: string;
  description: string;
  file?: {
    name: string;
    status: DocumentStatus;
    errorMessage?: string;
    revisionRemarks?: string;
  };
}

const initialRequiredDocuments: RequiredDocument[] = [
  {
    title: "Business Permit",
    description: "Current and valid business permit",
    file: {
      name: "Business-Permit-2026.pdf",
      status: "success",
    },
  },
  {
    title: "DTI/SEC Registration",
    description: "DTI or SEC certificate of registration",
    file: {
      name: "DTI-Certificate-2020.pdf",
      status: "success",
    },
  },
  {
    title: "Barangay Clearance",
    description: "Valid barangay clearance",
    file: {
      name: "Barangay-Clearance-2025.pdf",
      status: "revision",
      revisionRemarks:
        "Document has expired. Please upload the current 2026 barangay clearance.",
    },
  },
  {
    title: "Sanitary Permit",
    description: "Health permit from local health office",
  },
];

const businessTypeGroups = [
  {
    label: "Accommodation Establishments",
    options: [
      "Hotel",
      "Resort",
      "Apartment Hotel",
      "Mabuhay Accommodation",
      "Homestay",
    ],
  },
  {
    label: "Travel and Tour Services",
    options: [
      "Travel and Tour Agency",
      "Travel Agency",
      "Tour Operator",
      "Online Travel Agency",
    ],
  },
  {
    label: "Tourist Transport Operators",
    options: [
      "Tourist Land Transport Operator",
      "Tourist Water Transport Operator",
      "Tourist Air Transport Operator",
      "Motorized Banca",
    ],
  },
  {
    label: "Meetings, Incentives, Conventions and Exhibitions (MICE)",
    options: ["MICE Organizer", "MICE Facility/ Venue"],
  },
  {
    label: "Adventure/ Sports and Ecotourism Facilities",
    options: ["Adventure/ Sports and Ecotourism Facility"],
  },
  {
    label: "Tourism-related Enterprises",
    options: [
      "Restaurant",
      "Tourism Training Center",
      "Target Shooting Range",
      "Department Store/ Shopping Mall/ Tourist Shop/ Specialty Shop",
      "Farm Tourism Camp",
      "Gallery/ Museum",
      "Tourism Entertainment Complex",
      "Tourism Recreation Center",
      "Zoo",
      "Rest Area/ Restroom",
      "Surfing Camp",
    ],
  },
  {
    label: "Health and Wellness Services",
    options: ["Ambulatory Clinic", "Spa", "Tertiary Hospital"],
  },
];

const acceptedRequiredDocumentExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
const maxRequiredDocumentSize = 10 * 1024 * 1024;

export function ApplicationForm({
  onBack,
  onSubmit,
  initialAccreditationType = "New Accreditation",
}: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [accreditationType, setAccreditationType] = useState(
    initialAccreditationType
  );
  const [businessType, setBusinessType] = useState("Resort");
  const [applicationStatus, setApplicationStatus] = useState<"Draft" | "Pending">(
    "Draft"
  );
  const [applicationNumber, setApplicationNumber] = useState("BAC-2026-0001");
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>(
    initialRequiredDocuments
  );

  const uploadedRequiredCount = requiredDocuments.filter(
    (document) => document.file?.status === "success"
  ).length;
  const requiredDocumentsComplete =
    uploadedRequiredCount === requiredDocuments.length;

  const steps = [
    { id: 1, title: "Business Details", description: "Basic information" },
    { id: 2, title: "Owner & Contact", description: "Contact information" },
    { id: 3, title: "Required Documents", description: "Upload files" },
    { id: 4, title: "Review & Submit", description: "Final check" },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRequiredDocumentUpload = (title: string, file: File) => {
    const fileExtension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();
    const errorMessage = !acceptedRequiredDocumentExtensions.includes(fileExtension)
      ? "Only PDF, JPG, or PNG files are accepted."
      : file.size > maxRequiredDocumentSize
      ? "File must not exceed 10MB."
      : "";

    setRequiredDocuments((documents) =>
      documents.map((document) =>
        document.title === title
          ? {
              ...document,
              file: {
                name: file.name,
                status: errorMessage ? "error" : "success",
                errorMessage: errorMessage || undefined,
              },
            }
          : document
      )
    );

    if (errorMessage) {
      toast.error(`${title}: ${errorMessage}`);
      return;
    }

    toast.success(`${title} uploaded`);
  };

  const handleRequiredDocumentRemove = (title: string) => {
    setRequiredDocuments((documents) =>
      documents.map((document) =>
        document.title === title
          ? {
              ...document,
              file: undefined,
            }
          : document
      )
    );
    toast.info(`${title} removed`);
  };

  const handleSaveDraft = () => {
    setApplicationStatus("Draft");
    toast.success("Application saved as draft");
  };

  const handleSubmit = () => {
    const generatedNumber = `BAC-${new Date().getFullYear()}-0001`;
    setApplicationNumber(generatedNumber);
    setApplicationStatus("Pending");
    onSubmit(generatedNumber);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1>
          {accreditationType === "Renewal"
            ? "Renew Business Accreditation"
            : "Apply for Business Accreditation"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete all steps to submit your accreditation application
        </p>
      </div>

      <ProgressStepper steps={steps} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label required>Accreditation Type</Label>
                <Select
                  value={accreditationType}
                  onChange={(event) => setAccreditationType(event.target.value)}
                >
                  <option value="New Accreditation">New Accreditation</option>
                  <option value="Renewal">Renewal</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Business Name</Label>
                  <Input
                    placeholder="Enter business name"
                    defaultValue="Sunset Beach Resort"
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Business Type</Label>
                  <Select
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value)}
                  >
                    {businessTypeGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>DTI Registration Number</Label>
                  <Input
                    placeholder="XXX-XXX-XXX-XXX"
                    defaultValue="123-456-789-012"
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Business Permit Number</Label>
                  <Input
                    placeholder="BP-YYYY-000000"
                    defaultValue="BP-2026-004218"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Year Established</Label>
                  <Input type="number" placeholder="YYYY" defaultValue="2020" />
                </div>
              </div>

              <div className="space-y-2">
                <Label required>Business Description</Label>
                <Textarea
                  placeholder="Describe your business, facilities, and services..."
                  rows={4}
                  defaultValue="A beachfront resort offering luxury accommodations, water sports activities, and fine dining experiences."
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Owner Full Name</Label>
                  <Input
                    placeholder="Enter full name"
                    defaultValue="John Martinez"
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Contact Number</Label>
                  <Input
                    placeholder="+63 XXX XXX XXXX"
                    defaultValue="+63 912 345 6789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    defaultValue="john@sunsetresort.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    placeholder="https://"
                    defaultValue="https://sunsetresort.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label required>Business Address</Label>
                <Textarea
                  placeholder="Street, Barangay, City, Province"
                  rows={3}
                  defaultValue="123 Beach Road, Brgy. Coastal, Tourism City, Province"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label required>City/Municipality</Label>
                  <Input defaultValue="Tourism City" />
                </div>
                <div className="space-y-2">
                  <Label required>Province</Label>
                  <Input defaultValue="Province" />
                </div>
                <div className="space-y-2">
                  <Label required>Postal Code</Label>
                  <Input defaultValue="4000" />
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Document Completion Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Document Upload Progress
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      All required documents must be uploaded before submission
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-blue-900">
                      {uploadedRequiredCount} of {requiredDocuments.length}
                    </p>
                    <p className="text-xs text-blue-700">Required uploaded</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload the required documents for your accreditation application.
                  All files must be in PDF, JPEG, JPG, or PNG format and not exceed 10MB per file.
                </p>

                {/* Required Documents - 2 Column Grid */}
                <div className="space-y-3 mb-6">
                  <h4 className="flex items-center gap-2">
                    Required Documents
                    <span className="text-destructive text-sm">*</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocuments.map((document) => (
                      <FileUploadCard
                        key={document.title}
                        title={document.title}
                        description={document.description}
                        required
                        file={document.file}
                        onUpload={(file) =>
                          handleRequiredDocumentUpload(document.title, file)
                        }
                        onRemove={() => handleRequiredDocumentRemove(document.title)}
                        maxFileSize="10MB"
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-accent rounded-lg p-6 border border-border">
                <h3 className="mb-4">Application Summary</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Business Name
                    </p>
                    <p className="font-medium">Sunset Beach Resort</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                      Business Type
                    </p>
                      <p className="font-medium">{businessType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Year Established
                      </p>
                      <p className="font-medium">2020</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        DTI Registration Number
                      </p>
                      <p className="font-medium">123-456-789-012</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Business Permit Number
                      </p>
                      <p className="font-medium">BP-2026-004218</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Application Number
                      </p>
                      <p className="font-medium">{applicationNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Accreditation Type
                      </p>
                      <p className="font-medium">{accreditationType}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Status
                    </p>
                    <p className="font-medium">{applicationStatus}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Owner
                    </p>
                    <p className="font-medium">John Martinez</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Contact
                    </p>
                    <p className="font-medium">
                      +63 912 345 6789 • john@sunsetresort.com
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Address
                    </p>
                    <p className="font-medium">
                      123 Beach Road, Brgy. Coastal, Tourism City, Province
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Documents Uploaded
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {requiredDocuments
                        .filter((document) => document.file?.status === "success")
                        .map((document) => (
                          <li className="text-sm" key={document.title}>
                            {document.title}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Important:</strong> By submitting this application,
                  you confirm that all information provided is accurate and all
                  documents are authentic. False information may result in
                  application rejection.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="size-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 3 && !requiredDocumentsComplete}
            >
              Next
              <ArrowRight className="size-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Send className="size-4 mr-2" />
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
