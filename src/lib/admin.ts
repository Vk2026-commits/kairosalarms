export const LEAD_STATUSES = ["new", "contacted", "follow-up", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const ADMIN_ASSIGNEES = [
  "unassigned",
  "staylor@kairossecurity.com",
  "rrose@vektiss.com",
] as const;
export type AdminAssignee = (typeof ADMIN_ASSIGNEES)[number];

export type AdminLead = {
  id: string;
  createdAt: string | null;
  name: string;
  phone: string;
  email: string;
  zip: string;
  propertyType: string | null;
  exteriorDoors: string | null;
  securityType: string | null;
  callConsent: boolean;
  source: string;
  status: LeadStatus;
  assignedTo: AdminAssignee;
  followUpAt: string | null;
  notes: string;
  updatedAt: string | null;
  revision: string | null;
};

export type AdminLeadFilters = {
  search: string;
  status: "all" | LeadStatus;
  assignedTo: "all" | AdminAssignee;
  dueOnly: boolean;
};
export type AdminLeadQuery = AdminLeadFilters & { page: number };
export type AdminLeadPage = { leads: AdminLead[]; total: number; page: number; pageSize: number };
export type AdminLeadUpdate = Pick<
  AdminLead,
  "id" | "status" | "assignedTo" | "followUpAt" | "notes" | "revision"
>;
export type AdminSession = {
  authenticated: boolean;
  configured: boolean;
  expiresAt: number | null;
};
export const DEFAULT_ADMIN_FILTERS: AdminLeadFilters = {
  search: "",
  status: "all",
  assignedTo: "all",
  dueOnly: false,
};

export function statusLabel(status: LeadStatus): string {
  return { new: "New", contacted: "Contacted", "follow-up": "Follow-up", won: "Won", lost: "Lost" }[
    status
  ];
}
export function assigneeLabel(assignee: AdminAssignee): string {
  return {
    unassigned: "Unassigned",
    "staylor@kairossecurity.com": "Stephen Taylor",
    "rrose@vektiss.com": "Rose",
  }[assignee];
}
export function securityLabel(value: string | null): string {
  return (
    {
      alarm: "Alarm system",
      "alarm-doorbell": "Alarm + doorbell camera",
      "alarm-cameras": "Alarm + security cameras",
      "not-sure": "Wants recommendations",
    }[value ?? ""] ?? "Not provided"
  );
}
