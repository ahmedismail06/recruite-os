import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// No login: the app is single-user and every query runs server-side
// (server components + server actions), so we use the project secret key.
// It bypasses RLS — never expose it to the browser (no NEXT_PUBLIC_ prefix)
// and never deploy this app to a publicly reachable URL without protection.
export async function createClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY in webapp/.env.local (dashboard → Project Settings → API keys)."
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
