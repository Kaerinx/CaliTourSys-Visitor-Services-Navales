import type { ApplicationStatus } from "../components/StatusBadge";

export interface BusinessOwnerApplication {
  id: string;
  businessName: string;
  type: string;
  status: ApplicationStatus;
  submittedDate: string;
  lastUpdate: string;
  validUntil?: string;
}

export const businessOwnerApplications: BusinessOwnerApplication[] = [
  {
    id: "APP-2026-001",
    businessName: "Sunset Beach Resort",
    type: "New Application",
    status: "under_review",
    submittedDate: "2026-05-10",
    lastUpdate: "2026-05-12",
  },
  {
    id: "APP-2025-042",
    businessName: "Sunset Beach Resort",
    type: "Renewal",
    status: "approved",
    submittedDate: "2026-04-28",
    lastUpdate: "2026-05-01",
    validUntil: "2027-05-01",
  },
  {
    id: "APP-2025-015",
    businessName: "Sunset Beach Resort",
    type: "New Application",
    status: "for_revision",
    submittedDate: "2026-03-15",
    lastUpdate: "2026-03-20",
  },
  {
    id: "APP-2024-089",
    businessName: "Sunset Beach Resort",
    type: "Renewal",
    status: "expired",
    submittedDate: "2024-05-10",
    lastUpdate: "2024-05-15",
    validUntil: "2025-05-15",
  },
];
