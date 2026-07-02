import { createClient } from "@/lib/supabase/server";
import { INTERACTION_TYPES } from "@/lib/constants";
import { contactFollowUpDue, daysSince, type Contact } from "@/lib/types";
import { addContact, logTouch } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recruiting_contacts")
    .select("*")
    .order("last_touch_date", { ascending: true, nullsFirst: true });
  const contacts = (data ?? []) as Contact[];
  const dueCount = contacts.filter(contactFollowUpDue).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-lg font-semibold">Contacts</h1>
      <p className="text-sm text-slate-500">
        {contacts.length} contacts · {dueCount} follow-up
        {dueCount === 1 ? "" : "s"} due
      </p>

      <form
        action={addContact}
        className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3"
      >
        <input
          name="name"
          required
          placeholder="Name"
          className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          name="company"
          placeholder="Company"
          className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-52 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          name="notes"
          placeholder="Notes"
          className="grow rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          Add contact
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {contacts.map((c) => {
          const due = contactFollowUpDue(c);
          const silentDays = daysSince(c.last_touch_date ?? c.created_at);
          return (
            <div
              key={c.id}
              className={`rounded-lg border bg-white p-4 ${
                due ? "border-amber-300" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium">{c.name}</span>
                  {c.company && (
                    <span className="ml-2 text-sm text-slate-500">
                      {c.company}
                    </span>
                  )}
                  {c.email && (
                    <span className="ml-2 text-xs text-slate-400">
                      {c.email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {c.last_touch_date ? (
                    <span className="text-slate-400">
                      last touch {silentDays}d ago ({c.last_touch_direction})
                    </span>
                  ) : (
                    <span className="text-slate-400">never contacted</span>
                  )}
                  {due && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                      follow-up due
                    </span>
                  )}
                </div>
              </div>
              {c.notes && (
                <p className="mt-1 text-sm text-slate-500">{c.notes}</p>
              )}
              <form
                action={logTouch}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="contact_id" value={c.id} />
                <select
                  name="direction"
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  <option value="sent">I reached out</option>
                  <option value="received">They replied</option>
                </select>
                <select
                  name="type"
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  name="summary"
                  placeholder="Summary (optional)"
                  className="grow rounded-md border border-slate-300 px-2 py-1 text-xs"
                />
                <button className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50">
                  Log touch (today)
                </button>
              </form>
            </div>
          );
        })}
        {contacts.length === 0 && (
          <p className="text-sm text-slate-400">No contacts yet.</p>
        )}
      </div>
    </main>
  );
}
