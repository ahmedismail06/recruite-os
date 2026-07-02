"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_STATUSES, type RoleStatus } from "@/lib/constants";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

// ── Roles ───────────────────────────────────────────────────────

export async function addRole(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recruiting_roles")
    .insert({
      company: str(formData, "company"),
      title: str(formData, "title"),
      jd_text: str(formData, "jd_text"),
      source: "manual",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/roles/${data.id}`);
}

export async function updateRoleStatus(formData: FormData) {
  const status = str(formData, "status") as RoleStatus | null;
  const roleId = str(formData, "role_id");
  if (!roleId || !status || !ROLE_STATUSES.includes(status)) return;

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "applied") {
    const { data: role } = await supabase
      .from("recruiting_roles")
      .select("date_applied")
      .eq("id", roleId)
      .single();
    if (role && !role.date_applied) patch.date_applied = new Date().toISOString();
  }
  const { error } = await supabase
    .from("recruiting_roles")
    .update(patch)
    .eq("id", roleId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/roles/${roleId}`);
}

export async function updateFitRationale(formData: FormData) {
  const roleId = str(formData, "role_id");
  if (!roleId) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("recruiting_roles")
    .update({ fit_rationale: str(formData, "fit_rationale") })
    .eq("id", roleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/roles/${roleId}`);
}

// ── Applications ────────────────────────────────────────────────

export async function logApplication(formData: FormData) {
  const roleId = str(formData, "role_id");
  if (!roleId) return;
  const supabase = await createClient();

  const { error } = await supabase
    .from("recruiting_applications")
    .insert({ role_id: roleId, stage: "applied" });
  if (error) throw new Error(error.message);

  await supabase
    .from("recruiting_roles")
    .update({ status: "applied", date_applied: new Date().toISOString() })
    .eq("id", roleId)
    .is("date_applied", null);
  await supabase
    .from("recruiting_roles")
    .update({ status: "applied" })
    .eq("id", roleId)
    .eq("status", "interested");

  revalidatePath("/");
  revalidatePath(`/roles/${roleId}`);
}

export async function updateApplication(formData: FormData) {
  const appId = str(formData, "application_id");
  const roleId = str(formData, "role_id");
  if (!appId) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("recruiting_applications")
    .update({
      stage: str(formData, "stage") ?? "applied",
      next_action: str(formData, "next_action"),
      next_action_due: str(formData, "next_action_due"),
    })
    .eq("id", appId);
  if (error) throw new Error(error.message);
  if (roleId) revalidatePath(`/roles/${roleId}`);
  revalidatePath("/");
}

// ── Contacts ────────────────────────────────────────────────────

export async function addContact(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("recruiting_contacts").insert({
    name: str(formData, "name"),
    company: str(formData, "company"),
    email: str(formData, "email"),
    notes: str(formData, "notes"),
    role_id: str(formData, "role_id"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/contacts");
}

export async function logTouch(formData: FormData) {
  const contactId = str(formData, "contact_id");
  const direction = str(formData, "direction");
  if (!contactId || !direction) return;
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("recruiting_contacts")
    .update({ last_touch_date: today, last_touch_direction: direction })
    .eq("id", contactId);
  if (error) throw new Error(error.message);

  await supabase.from("recruiting_interactions").insert({
    contact_id: contactId,
    type: str(formData, "type") ?? "email",
    summary: str(formData, "summary"),
  });

  revalidatePath("/contacts");
}

// ── Interactions ────────────────────────────────────────────────

export async function addInteraction(formData: FormData) {
  const roleId = str(formData, "role_id");
  const supabase = await createClient();
  const { error } = await supabase.from("recruiting_interactions").insert({
    application_id: str(formData, "application_id"),
    contact_id: str(formData, "contact_id"),
    type: str(formData, "type") ?? "other",
    summary: str(formData, "summary"),
  });
  if (error) throw new Error(error.message);
  if (roleId) revalidatePath(`/roles/${roleId}`);
}
