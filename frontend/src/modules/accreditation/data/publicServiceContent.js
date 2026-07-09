export const serviceIdentity = {
  municipality: "Municipality of Calabanga",
  office: "Tourism Office",
  serviceName: "Business Accreditation Service",
  description:
    "A public online service where tourism-related businesses can register, prepare requirements, submit accreditation documents, and track certificate or endorsement release.",
};

export const serviceOverview = {
  title: "Issuance of Tourism Certificate of Registration / Endorsement for DOT Accreditation",
  description:
    "For tourism-related establishments operating in Calabanga that need a local certificate of registration or endorsement to support DOT accreditation.",
  whoCanApply: "Business owners or authorized representatives of tourism-related establishments in Calabanga.",
  processingTime: "Initial business verification depends on officer review and document completeness.",
  fee: "Registration or endorsement fees may apply. The Tourism Office confirms the payable amount during review.",
  validatesBy: "Municipality of Calabanga Tourism Office",
  confirms:
    "The certificate or endorsement confirms that the business submitted required local documents and passed local tourism office review for the requested accreditation transaction.",
  updateTiming:
    "Applicants receive system and email updates after business verification, document review, correction requests, approval, and certificate release scheduling.",
};

export const serviceCapabilities = [
  {
    title: "Business account registration",
    description:
      "Create an applicant account and submit the business details needed for initial verification.",
  },
  {
    title: "Requirements preparation",
    description:
      "Check which documents apply based on business structure, tourism category, and application type.",
  },
  {
    title: "Online application and upload",
    description:
      "Complete the profile, upload accepted files, and submit the accreditation application for review.",
  },
  {
    title: "Status tracking and release",
    description:
      "Receive clear status updates, correction notices, approval results, and certificate release instructions.",
  },
];

export const guideResource = {
  title: "Accreditation Guide.pdf",
  href: "/downloads/Accreditation%20Guide.pdf",
  description:
    "View the downloadable guide for the complete list of requirements, forms, and instructions.",
};

export const establishmentExamples = [
  "Resorts and accommodation establishments",
  "Restaurants and food businesses",
  "Travel and tour operators",
  "Tourist attractions",
  "Souvenir shops and local product businesses",
  "Other tourism-related establishments in Calabanga",
];

export const requiredBusinessInformation = [
  "Business name and operating address",
  "Owner or authorized representative details",
  "Active email address and contact number",
  "Business category and permit information",
];

export const processSteps = [
  {
    title: "Create an applicant account",
    instruction: "Register as the owner or authorized representative.",
    applicantAction: "Select the business structure and provide contact details.",
    officerAction: "System records the account for business verification.",
    status: "For Business Verification",
  },
  {
    title: "Select business type",
    instruction: "Choose Sole Proprietorship, Partnership, or Corporation.",
    applicantAction: "Confirm owner, partner, or representative information.",
    officerAction: "System adjusts fields and document expectations.",
    status: "Draft",
  },
  {
    title: "Submit business information",
    instruction: "Enter the registered name, address, category, and permit details.",
    applicantAction: "Send the registration details for checking.",
    officerAction: "Officer verifies whether the business can proceed.",
    status: "For Business Verification",
  },
  {
    title: "Wait for business verification",
    instruction: "Monitor email and system messages.",
    applicantAction: "Wait or respond if the Tourism Office asks for clarification.",
    officerAction: "Officer approves or flags the business registration.",
    status: "Business Verified",
  },
  {
    title: "Verify email account",
    instruction: "Open the verification link after the business is cleared.",
    applicantAction: "Confirm ownership of the registered email address.",
    officerAction: "System activates sign-in access.",
    status: "Email Verification Required",
  },
  {
    title: "Sign in to the system",
    instruction: "Use the verified email and password.",
    applicantAction: "Open the applicant dashboard.",
    officerAction: "System shows profile, applications, and notifications.",
    status: "For Document Upload",
  },
  {
    title: "Complete business profile",
    instruction: "Review and update the full business profile.",
    applicantAction: "Add permit numbers, category, address, and map location.",
    officerAction: "System uses the profile for the application record.",
    status: "Draft",
  },
  {
    title: "Upload required documents",
    instruction: "Attach the files listed for the selected business category.",
    applicantAction: "Upload PDF, JPG, or PNG files.",
    officerAction: "System checks file type and stores the documents.",
    status: "For Document Upload",
  },
  {
    title: "Submit accreditation application",
    instruction: "Review all entries and submit the application.",
    applicantAction: "Confirm that the details and attachments are complete.",
    officerAction: "Officer queue receives the application.",
    status: "Submitted",
  },
  {
    title: "Officer reviews documents",
    instruction: "The Tourism Office checks the information and uploads.",
    applicantAction: "Wait for review or prepare corrections.",
    officerAction: "Officer approves, rejects, or requests correction.",
    status: "For Officer Review",
  },
  {
    title: "Receive status updates",
    instruction: "Check the dashboard and email notifications.",
    applicantAction: "Correct missing or unreadable documents if requested.",
    officerAction: "Officer rechecks corrected submissions.",
    status: "Needs Correction",
  },
  {
    title: "Receive certificate release notice",
    instruction: "Follow the release or claiming instructions.",
    applicantAction: "Claim the certificate or coordinate delivery if allowed.",
    officerAction: "Tourism Office marks the transaction completed.",
    status: "Certificate for Release",
  },
];

export const businessLegalTypes = [
  {
    value: "sole-proprietorship",
    title: "Sole Proprietorship",
    summary: "Requires one owner and owner identity details.",
    fields: ["Owner information", "DTI registration details", "Owner authorization confirmation"],
    validation: "One owner record is required before registration can continue.",
  },
  {
    value: "partnership",
    title: "Partnership",
    summary: "Allows multiple partners depending on the registration.",
    fields: ["Managing partner", "Partner list", "Partnership registration details"],
    validation: "At least one managing partner and valid registration details are required.",
  },
  {
    value: "corporation",
    title: "Corporation",
    summary: "Requires company details and authorized representative information.",
    fields: ["Company registration", "Authorized representative", "Board or secretary certificate if required"],
    validation: "Representative authority and company registration fields are required.",
  },
];

export const requirementProfiles = [
  {
    label: "Identity and authority",
    items: [
      { name: "Owner or representative valid ID", format: "PDF, JPG, PNG", copy: "E-copy", note: "Must match the registered applicant." },
      { name: "Authorization letter or board secretary certificate", format: "PDF", copy: "E-copy", note: "Required for representatives, partnerships, and corporations." },
    ],
  },
  {
    label: "Business registration",
    items: [
      { name: "Business Permit", format: "PDF, JPG, PNG", copy: "E-copy", note: "Use the latest permit issued for the business." },
      { name: "DTI or SEC Registration", format: "PDF, JPG, PNG", copy: "E-copy", note: "DTI for sole proprietorship; SEC for partnership or corporation." },
      { name: "Barangay Clearance", format: "PDF, JPG, PNG", copy: "E-copy", note: "Must reflect the operating barangay." },
    ],
  },
  {
    label: "Safety and compliance",
    items: [
      { name: "Fire Safety Inspection Certificate", format: "PDF, JPG, PNG", copy: "E-copy", note: "Required for establishments with physical premises." },
      { name: "Sanitary Permit", format: "PDF, JPG, PNG", copy: "E-copy", note: "Especially important for food, accommodation, and wellness businesses." },
      { name: "Zoning or Location Clearance", format: "PDF, JPG, PNG", copy: "E-copy", note: "Confirms the business location is acceptable." },
    ],
  },
];

export const applicationTypes = ["New Accreditation", "Renewal"];

export const applicantStatuses = [
  "Draft",
  "Submitted",
  "For Business Verification",
  "Business Verified",
  "Email Verification Required",
  "For Document Upload",
  "For Officer Review",
  "Needs Correction",
  "Approved",
  "Accredited",
  "Certificate for Release",
  "Completed",
];

export const notificationPoints = [
  "Business verification result",
  "Email verification link",
  "Missing or incorrect documents",
  "Application approval or rejection",
  "Accreditation completion",
  "Certificate release schedule or claiming instructions",
];

export const accountCreationFlow = [
  "Select business structure and tourism category.",
  "Enter applicant, owner, partner, or representative details.",
  "Enter registration, permit, address, and contact details.",
  "Submit business information for initial verification.",
  "Wait while the Tourism Office verifies the business information.",
  "Verify the email link after verification approval.",
  "Sign in and continue the accreditation application.",
];

export const serviceNotes = [
  "The Calabanga Tourism Office only processes registration and endorsement for tourism establishments within the Municipality of Calabanga. Official DOT Accreditation is subject to the evaluation and approval of the Department of Tourism.",
  "Applicants are responsible for ensuring that all submitted information and documents are complete, accurate, and updated. Incomplete or incorrect submissions may cause delays in processing.",
  "For delivery requests, courier fees shall be shouldered by the applicant.",
];

export const eligibilityQuestions = [
  {
    id: "operatesInCalabanga",
    label: "Does the business operate within the Municipality of Calabanga?",
    help: "The Tourism Office will verify the operating address during review.",
  },
  {
    id: "supportedCategory",
    label: "Does the business belong to one of the supported tourism business categories?",
    help: "You can review the category list below before continuing.",
  },
  {
    id: "authorizedApplicant",
    label: "Are you the owner or an authorized representative of the business?",
    help: "The person registering must be authorized to provide and certify business information.",
  },
  {
    id: "canProvideDocuments",
    label: "Can you provide the required business documents?",
    help: "Missing or unreadable documents may lead to a revision request.",
  },
];

export const serviceContact = {
  office: "Municipality of Calabanga Tourism Office",
  address: "LGU Calabanga, Camarines Sur 4405",
  phone: "+63 54 871 1234",
  email: "tourism@calabanga.gov.ph",
  note: "Contact details must be confirmed by the LGU before production use.",
};
