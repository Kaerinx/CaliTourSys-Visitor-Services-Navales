export const serviceIdentity = {
  municipality: "Municipality of Calabanga",
  office: "Tourism Office",
  serviceName: "Tourism Business Registration and Accreditation",
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
  title: "Updated Guidelines on the Progressive Accreditation System",
  href: "/downloads/DOT-MC-No.-2023-0003-Updated-Guidelines-UPAS.pdf",
  downloadName: "DOT-MC-No.-2023-0003-Updated-Guidelines-UPAS.pdf",
  description:
    "Review the Department of Tourism guidelines and accreditation standards without leaving the Online Accreditation page.",
};

export const certificateRegistrationDetails = {
  purpose:
    "The Tourism Certificate of Registration is issued to tourism-related enterprises that have submitted the minimum documentary requirements, paid the corresponding local fees when applicable, and complied with the registration procedures of the Municipality of Calabanga.",
  office: "Calabanga Tourism Department / Municipal Tourism Office",
  classification: "Complex",
  transactionType: "G2B - Government to Business Entity",
  whoMayAvail:
    "Owners, operators, authorized representatives, and managers of tourism-related enterprises operating or intending to operate within the Municipality of Calabanga.",
  requirements: [
    "Unified Business Permit Application Form or equivalent business registration application form",
    "DTI, SEC, CDA, or other applicable registration document based on business type",
    "Barangay Clearance for the business location",
    "Current Business Permit or Mayor's Permit, if already issued or renewed",
    "Tax bill, assessment, or official receipt showing payment of local fees when assessed",
    "Valid government-issued ID of the owner or authorized representative",
    "Surety bond or insurance coverage for travel agencies and similar enterprises when required",
  ],
  process: [
    "Submit the accomplished application form and complete documentary requirements.",
    "Wait for confirmation and notice of any lacking or unclear documents.",
    "Respond to correction requests, if applicable.",
    "Wait for evaluation, verification, inspection, or inter-office coordination when necessary.",
    "Wait for approval and signing of the Tourism Certificate of Registration.",
    "Receive release notice and claim the certificate through the approved release method.",
  ],
  processingTime: "7 working days upon receipt of complete requirements",
  notes: [
    "Processing time starts only upon receipt of a complete application and complete documentary requirements.",
    "The Tourism Certificate of Registration is not a substitute for other permits required by law.",
    "Fees and validity period must follow the latest ordinance, local revenue code, or approved policy of the Municipality of Calabanga.",
  ],
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
    instruction: "Register using your active email address and contact details.",
  },
  {
    title: "Choose your business structure",
    instruction: "Select Sole Proprietorship, Partnership, or Corporation.",
  },
  {
    title: "Submit business information",
    instruction: "Enter the business name, address, category, and permit details.",
  },
  {
    title: "Wait for Tourism Office verification",
    instruction: "A tourism staff or officer checks if the account can proceed.",
  },
  {
    title: "Sign in after approval",
    instruction: "Once verified, use your registered email and password to access the dashboard.",
  },
  {
    title: "Complete business profile",
    instruction: "Review your business details and update missing information.",
  },
  {
    title: "Upload required documents",
    instruction: "Attach the required PDF, JPG, or PNG files.",
  },
  {
    title: "Submit accreditation application",
    instruction: "Review all information, then submit the application for checking.",
  },
  {
    title: "Wait for document review",
    instruction: "The Tourism Office reviews the submitted information and documents.",
  },
  {
    title: "Respond to corrections if needed",
    instruction: "Upload corrected documents or update details when requested.",
  },
  {
    title: "Receive certificate release notice",
    instruction: "Follow the instructions for claiming or receiving the certificate.",
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
