import type { RoleStatus } from "./constants";

export type Role = {
  id: string;
  company: string;
  title: string;
  jd_text: string | null;
  source: "manual" | "ai-suggested";
  status: RoleStatus;
  fit_rationale: string | null;
  date_added: string;
  date_applied: string | null;
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
