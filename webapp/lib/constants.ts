export const ROLE_STATUSES = [
  "interested",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
  "not_interested",
  "posting_closed",
] as const;

export type RoleStatus = (typeof ROLE_STATUSES)[number];

export const STATUS_LABELS: Record<RoleStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  not_interested: "Not Interested",
  posting_closed: "Posting Closed",
};

// Which kanban column a status renders in — rejected/ghosted/not_interested/
// posting_closed share the de-emphasized "closed" column per the dashboard design.
export const STATUS_COLUMN: Record<RoleStatus, string> = {
  interested: "interested",
  applied: "applied",
  screening: "screening",
  interviewing: "interviewing",
  offer: "offer",
  rejected: "closed",
  ghosted: "closed",
  not_interested: "closed",
  posting_closed: "closed",
};

export const BOARD_COLUMNS = [
  { key: "interested", label: "Interested" },
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer", label: "Offer" },
  { key: "closed", label: "Closed" },
] as const;

export const INTERACTION_TYPES = ["email", "call", "coffee chat", "other"] as const;
