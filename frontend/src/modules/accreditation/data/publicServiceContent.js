export const serviceIdentity = {
  municipality: "Municipality of Calabanga",
  office: "Tourism Office",
  serviceName: "Business Accreditation Service",
  description:
    "An online public service for tourism businesses that need to apply for, renew, or monitor their municipal accreditation.",
};

export const serviceDetails = [
  {
    label: "Service availability",
    value: "Online applications are available",
    note: "Final availability schedule to be confirmed by the LGU.",
  },
  {
    label: "Processing time",
    value: "To be confirmed by the LGU",
    note: "Processing begins after a complete application is submitted.",
  },
  {
    label: "Application fee",
    value: "To be confirmed by the LGU",
    note: "Do not make a payment unless instructed by the Tourism Office.",
  },
];

export const serviceCapabilities = [
  {
    title: "Apply for accreditation",
    description: "Create an account and submit a new tourism business accreditation request.",
  },
  {
    title: "Request a renewal",
    description: "Use the same online service when an existing accreditation needs renewal.",
  },
  {
    title: "Track an application",
    description: "See whether your request is submitted, under review, for revision, or decided.",
  },
  {
    title: "Respond to revisions",
    description: "Review Tourism Office notes and provide corrected information or documents.",
  },
];

export const requiredBusinessInformation = [
  "Business name and operating address",
  "Owner or authorized representative details",
  "Active email address and contact number",
  "Business category and permit information",
];

export const processSteps = [
  {
    title: "Check if your business can apply",
    description: "Use the short advisory checklist before creating an account.",
  },
  {
    title: "Create your service account",
    description: "Register the owner or authorized representative and verify the email address.",
  },
  {
    title: "Complete and submit the application",
    description: "Provide business details and upload the required documents.",
  },
  {
    title: "Wait for Tourism Office review",
    description: "The Tourism Office may approve, reject, or request revisions to the submission.",
  },
  {
    title: "Track the decision",
    description: "Sign in to view updates and respond when further action is required.",
  },
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
