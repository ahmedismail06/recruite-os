"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OWNER_ID } from "@/lib/constants";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  if (data.user?.id !== OWNER_ID) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent("This account is not authorized for Recruiting OS.")}`);
  }

  redirect("/");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect(`/login?message=${encodeURIComponent("Magic link sent — check your email.")}`);
}
