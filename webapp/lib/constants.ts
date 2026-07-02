// Single-user app: everything is pinned to Ahmed's auth user, which lives in
// a Supabase project shared with the recipes app. RLS enforces this on the DB
// side (public.recruiting_owner()); this constant enforces it in the UI.
export const OWNER_ID = "a208e139-3cf1-40ed-aab5-417dc479c585";

export const ROLE_STATUSES = [
  "interested",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
] as const;

export type RoleStatus = (typeof ROLE_STATUSES)[number];

export const STATUS_COLORS: Record<RoleStatus, string> = {
  interested: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-800",
  screening: "bg-amber-100 text-amber-800",
  interviewing: "bg-violet-100 text-violet-800",
  offer: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
  ghosted: "bg-zinc-200 text-zinc-600",
};

export const INTERACTION_TYPES = ["email", "call", "coffee chat", "other"] as const;
