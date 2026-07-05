import type { RoleStatus } from "./constants";

export type Role = {
  id: string;
  company: string;
  title: string;
  jd_text: string | null;
  posting_url: string | null;
  source: "manual" | "ai-suggested";
  status: RoleStatus;
  fit_rationale: string | null;
  date_added: string;
  date_applied: string | null;
  not_yet_posted: boolean;
  last_checked_at: string | null;
};

export type Application = {
  id: string;
  role_id: string;
  stage: string;
  next_action: string | null;
  next_action_due: string | null;
  tailored_resume_path: string | null;
  resume_version: number;
  follow_up_due_days: number;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  name: string;
  company: string | null;
  role_id: string | null;
  email: string | null;
  title: string | null;
  linkedin_url: string | null;
  draft_message: string | null;
  last_touch_date: string | null;
  last_touch_direction: "sent" | "received" | null;
  follow_up_due_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Interaction = {
  id: string;
  contact_id: string | null;
  application_id: string | null;
  type: "email" | "call" | "coffee chat" | "other";
  summary: string | null;
  date: string;
  gmail_thread_id: string | null;
  created_at: string;
};

export type ProfileProject = {
  id: string;
  title: string;
  summary: string | null;
  problem: string | null;
  approach: string | null;
  impact: string | null;
  tech_stack: string[];
  tags: string[];
  repo_url: string | null;
  bullet_short: string | null;
  bullet_medium: string | null;
  bullet_detailed: string | null;
  date_range: string | null;
};

export type ProfileExperience = {
  id: string;
  role: string;
  org: string;
  date_range: string | null;
  problem: string | null;
  approach: string | null;
  impact: string | null;
  tech_stack: string[];
  tags: string[];
  bullet_short: string | null;
  bullet_medium: string | null;
  bullet_detailed: string | null;
};

export type ProfileSkill = {
  id: string;
  name: string;
  category: "language" | "framework" | "tool" | "coursework" | "cert";
  source: string | null;
};

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function contactFollowUpDue(c: Contact): boolean {
  const days = daysSince(c.last_touch_date ?? c.created_at);
  return days !== null && days > c.follow_up_due_days;
}

export function applicationFollowUpDue(app: Application, role: Role): boolean {
  if (!["applied", "screening", "interviewing"].includes(role.status)) return false;
  const last = [role.date_applied, app.updated_at]
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime());
  if (last.length === 0) return false;
  const days = Math.floor((Date.now() - Math.max(...last)) / 86_400_000);
  return days > app.follow_up_due_days;
}

export function isClosedStatus(status: RoleStatus): boolean {
  return status === "rejected" || status === "ghosted";
}

// Days since the role last moved — used as the "freshness" cue on cards.
// Interested roles age from when they were saved; anything past that ages
// from the most recent of date_applied / an application's updated_at.
export function daysInStage(role: Role, apps: Application[]): number {
  if (role.status === "interested") {
    return daysSince(role.date_added) ?? 0;
  }
  const timestamps = [
    role.date_applied,
    ...apps.filter((a) => a.role_id === role.id).map((a) => a.updated_at),
  ]
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime());
  if (timestamps.length === 0) return daysSince(role.date_added) ?? 0;
  return Math.floor((Date.now() - Math.max(...timestamps)) / 86_400_000);
}

export type Freshness = "fresh" | "aging" | "stale";

export function freshness(days: number): Freshness {
  if (days >= 14) return "stale";
  if (days >= 5) return "aging";
  return "fresh";
}

export function latestApplication(
  apps: Application[],
  roleId: string
): Application | null {
  const forRole = apps.filter((a) => a.role_id === roleId);
  if (forRole.length === 0) return null;
  return forRole.reduce((latest, a) =>
    new Date(a.updated_at).getTime() > new Date(latest.updated_at).getTime() ? a : latest
  );
}
