import { createClient } from "@/lib/supabase/server";
import { INTERACTION_TYPES } from "@/lib/constants";
import { contactFollowUpDue, daysSince, type Contact } from "@/lib/types";
import { addContact, logTouch, updateDraftMessage } from "@/app/actions";
import { ExternalIcon } from "@/components/PostingLink";
import CopyButton from "@/components/CopyButton";

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
    <div className="px-7 pt-8 pb-6">
      <div className="mb-[18px] flex items-baseline gap-2.5">
        <span className="text-xl font-semibold text-text-primary">Contacts</span>
        <span className="font-mono text-[13px] text-text-tertiary">
          {contacts.length} total · {dueCount} follow-up{dueCount === 1 ? "" : "s"} due
        </span>
      </div>

      <details className="mb-5 rounded-[7px] border border-border">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-[13px] font-semibold text-text-mid">
          + Add contact
        </summary>
        <form
          action={addContact}
          className="flex flex-wrap items-center gap-2 border-t border-border-soft p-3"
        >
          <input
            name="name"
            required
            placeholder="Name"
            className="w-40 rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
          />
          <input
            name="company"
            placeholder="Company"
            className="w-36 rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-52 rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
          />
          <input
            name="title"
            placeholder="Title"
            className="w-40 rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
          />
          <input
            name="linkedin_url"
            placeholder="LinkedIn URL"
            className="w-56 rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
          />
          <input
            name="notes"
            placeholder="Notes"
            className="grow rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
          />
          <button className="cursor-pointer rounded-[7px] bg-accent px-3 py-1.5 text-[13px] font-semibold text-white">
            Add contact
          </button>
        </form>
      </details>

      <div className="flex h-[34px] items-center gap-0 border-b border-border-strong px-3">
        <span className="flex-[2] text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          NAME
        </span>
        <span className="flex-[1.4] text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          COMPANY
        </span>
        <span className="flex-[2.2] text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          LAST INTERACTION
        </span>
        <span className="flex-1 text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          SILENT
        </span>
        <span className="flex-1 text-[11px] font-semibold tracking-[0.05em] text-text-tertiary" />
      </div>

      {contacts.map((c) => {
        const due = contactFollowUpDue(c);
        const silentDays = daysSince(c.last_touch_date ?? c.created_at);
        return (
          <div key={c.id} className="border-b border-border-soft p-3">
            <div className="flex items-center gap-0">
              <div className="min-w-0 flex-[2]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13.5px] font-semibold text-text-primary">{c.name}</span>
                  {c.linkedin_url && (
                    <a
                      href={c.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open LinkedIn profile"
                      aria-label={`Open ${c.name}'s LinkedIn profile`}
                      className="flex h-5 w-5 flex-none items-center justify-center rounded-[4px] text-text-tertiary transition-colors hover:bg-surface-muted hover:text-accent"
                    >
                      <ExternalIcon size={11} />
                    </a>
                  )}
                </div>
                {c.title && <div className="mt-0.5 text-xs text-text-secondary">{c.title}</div>}
                {c.email && (
                  <div className="mt-0.5 text-xs text-text-secondary">{c.email}</div>
                )}
              </div>
              <div className="flex-[1.4] text-[12.5px] text-text-mid">{c.company ?? "—"}</div>
              <div className="flex-[2.2] text-[12.5px] text-text-mid">
                {c.last_touch_date
                  ? `${c.last_touch_direction === "received" ? "they replied" : "reached out"} ${silentDays}d ago`
                  : "never contacted"}
                {c.notes && <span className="ml-1 text-text-tertiary">· {c.notes}</span>}
              </div>
              <div className="flex-1 font-mono text-xs">
                <span className={due ? "font-semibold text-danger" : "text-text-tertiary"}>
                  {silentDays ?? 0}d
                </span>
              </div>
              <div className="flex-1 text-right">
                <details className="inline-block">
                  <summary className="cursor-pointer list-none text-[12px] font-semibold text-accent">
                    Message{c.draft_message ? "" : " (none)"}
                  </summary>
                  <div className="mt-2 w-80 max-w-[80vw] text-left">
                    <form action={updateDraftMessage} className="flex flex-col gap-1.5">
                      <input type="hidden" name="contact_id" value={c.id} />
                      <textarea
                        name="draft_message"
                        defaultValue={c.draft_message ?? ""}
                        placeholder="Drafted LinkedIn message goes here — edit freely, then Copy and paste it into LinkedIn yourself."
                        className="min-h-[80px] w-full resize-y rounded-[7px] border border-border-strong p-2 text-xs text-text-primary outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        {c.draft_message && <CopyButton text={c.draft_message} />}
                        <button className="cursor-pointer rounded-[6px] border border-border-strong px-2 py-1 text-[11px] text-text-mid transition-colors hover:bg-surface-muted">
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </details>
                <span className="mx-1.5 text-text-quaternary">·</span>
                <details className="inline-block">
                  <summary className="cursor-pointer list-none text-[12px] font-semibold text-accent">
                    Log interaction
                  </summary>
                  <form
                    action={logTouch}
                    className="mt-2 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="contact_id" value={c.id} />
                    <select
                      name="direction"
                      className="rounded-[7px] border border-border-strong bg-card px-2 py-1 text-xs"
                    >
                      <option value="sent">I reached out</option>
                      <option value="received">They replied</option>
                    </select>
                    <select
                      name="type"
                      className="rounded-[7px] border border-border-strong bg-card px-2 py-1 text-xs"
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
                      className="grow rounded-[7px] border border-border-strong px-2 py-1 text-xs"
                    />
                    <button className="cursor-pointer rounded-[7px] border border-border-strong px-2 py-1 text-xs text-text-mid">
                      Log (today)
                    </button>
                  </form>
                </details>
              </div>
            </div>
          </div>
        );
      })}
      {contacts.length === 0 && (
        <p className="py-6 text-sm text-text-secondary">No contacts yet.</p>
      )}
    </div>
  );
}
