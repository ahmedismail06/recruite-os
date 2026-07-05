import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INTERACTION_TYPES } from "@/lib/constants";
import {
  applicationFollowUpDue,
  daysInStage,
  latestApplication,
  type Application,
  type Contact,
  type Interaction,
  type Role,
} from "@/lib/types";
import {
  addInteraction,
  logApplication,
  updateApplication,
  updateFitRationale,
  updatePostingUrl,
} from "@/app/actions";
import StageSelect from "@/components/StageSelect";
import JdText from "@/components/JdText";
import { ExternalIcon } from "@/components/PostingLink";
import { postingDomain } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: role } = await supabase
    .from("recruiting_roles")
    .select("*")
    .eq("id", id)
    .single<Role>();
  if (!role) notFound();

  const [{ data: applications }, { data: contacts }] = await Promise.all([
    supabase
      .from("recruiting_applications")
      .select("*")
      .eq("role_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("recruiting_contacts").select("*").eq("role_id", id),
  ]);
  const appList = (applications ?? []) as Application[];
  const contactList = (contacts ?? []) as Contact[];

  const appIds = appList.map((a) => a.id);
  const { data: interactions } = appIds.length
    ? await supabase
        .from("recruiting_interactions")
        .select("*")
        .in("application_id", appIds)
        .order("date", { ascending: false })
    : { data: [] };
  const interactionList = (interactions ?? []) as Interaction[];

  const latest = latestApplication(appList, role.id);
  const days = daysInStage(role, appList);

  const timeline = [
    { label: "Added", time: role.date_added },
    ...(role.date_applied ? [{ label: "Applied", time: role.date_applied }] : []),
    ...interactionList.map((it) => ({ label: `${it.type}${it.summary ? ` — ${it.summary}` : ""}`, time: it.date })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="px-7 pt-8 pb-6">
      <Link
        href="/roles"
        className="mb-4 inline-block text-[12.5px] text-text-tertiary transition-colors hover:text-text-primary"
      >
        ← Back to roles
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[21px] font-semibold text-text-primary">{role.company}</div>
          <div className="mt-0.5 text-sm text-text-secondary">{role.title}</div>
        </div>
        <div className="flex items-center gap-2.5">
          {role.posting_url && (
            <a
              href={role.posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-[7px] bg-accent px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Open posting
              <ExternalIcon size={12} />
            </a>
          )}
          <StageSelect
            roleId={role.id}
            status={role.status}
            className="cursor-pointer rounded-md border border-border-strong bg-surface-muted px-2.5 py-1.5 font-mono text-[12.5px] font-semibold text-text-mid transition-colors hover:border-border-strong hover:bg-bg"
          />
        </div>
      </div>

      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-[2] flex-col gap-5">
          <div>
            <div className="mb-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
              JOB DESCRIPTION
            </div>
            {role.jd_text ? (
              <JdText text={role.jd_text} />
            ) : (
              <div className="rounded-[7px] border border-dashed border-border-strong p-4 font-mono text-xs text-text-tertiary">
                No JD attached — paste one from the add-role flow to see it here.
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
              NOTES
            </div>
            <form action={updateFitRationale}>
              <input type="hidden" name="role_id" value={role.id} />
              <textarea
                name="fit_rationale"
                defaultValue={role.fit_rationale ?? ""}
                placeholder="Add notes about this role…"
                className="min-h-[90px] w-full resize-y rounded-[7px] border border-border-strong p-3 text-[13px] text-text-primary outline-none"
              />
              <button className="mt-2 cursor-pointer rounded-[7px] border border-border-strong px-3 py-1.5 text-[13px] text-text-mid transition-colors hover:bg-surface-muted">
                Save notes
              </button>
            </form>
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
              TIMELINE
            </div>
            <div className="flex flex-col">
              {timeline.map((t, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-2.5 border-b border-border-soft py-2.5"
                >
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-text-quaternary" />
                  <span className="flex-1 text-[13px] text-text-primary">{t.label}</span>
                  <span className="font-mono text-[11.5px] text-text-tertiary">
                    {new Date(t.time).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-lg border border-border-soft bg-surface-muted p-4">
            <div className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
              KEY FACTS
            </div>
            <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="text-text-secondary">Posting</span>
              {role.posting_url ? (
                <a
                  href={role.posting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate text-right font-mono text-[12px] text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
                >
                  {postingDomain(role.posting_url)} ↗
                </a>
              ) : (
                <span className="text-text-tertiary">—</span>
              )}
            </div>
            <form action={updatePostingUrl} className="flex gap-1.5">
              <input type="hidden" name="role_id" value={role.id} />
              <input
                name="posting_url"
                type="url"
                defaultValue={role.posting_url ?? ""}
                placeholder="Paste posting link…"
                className="h-[30px] min-w-0 flex-1 rounded-[6px] border border-border-strong bg-surface px-2 font-mono text-[11.5px] text-text-primary outline-none transition-colors placeholder:text-text-quaternary focus:border-accent"
              />
              <button className="h-[30px] cursor-pointer rounded-[6px] border border-border-strong px-2.5 text-xs text-text-mid transition-colors hover:bg-bg">
                Save
              </button>
            </form>
            <div className="flex justify-between border-t border-border-soft pt-3 text-[12.5px]">
              <span className="text-text-secondary">Days in stage</span>
              <span className="font-mono text-text-primary">{days}d</span>
            </div>
            <div className="flex justify-between text-[12.5px]">
              <span className="text-text-secondary">Resume version</span>
              <span className="text-text-primary">
                {latest ? `v${latest.resume_version}` : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-[12.5px]">
              <span className="text-text-secondary">Next action</span>
              <span className="text-right text-text-primary">
                {latest?.next_action ?? "—"}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
              LINKED CONTACTS
            </div>
            {contactList.length > 0 ? (
              <div className="flex flex-col gap-2">
                {contactList.map((c) => (
                  <Link
                    key={c.id}
                    href="/contacts"
                    className="block rounded-[7px] border border-border p-2.5 transition-colors hover:border-border-strong hover:bg-surface-muted"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-text-primary">{c.name}</span>
                      {c.linkedin_url && (
                        <ExternalIcon size={10} />
                      )}
                    </div>
                    {c.title && (
                      <div className="mt-0.5 text-[11.5px] text-text-secondary">{c.title}</div>
                    )}
                    {c.email && (
                      <div className="mt-0.5 text-[11.5px] text-text-secondary">{c.email}</div>
                    )}
                    {c.draft_message && (
                      <div className="mt-1 text-[11px] italic text-text-tertiary">
                        Draft message ready — view/copy on Contacts page
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-[12.5px] text-text-tertiary">No contacts linked yet.</div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
            APPLICATIONS
          </h2>
          <form action={logApplication}>
            <input type="hidden" name="role_id" value={role.id} />
            <button className="cursor-pointer rounded-[7px] bg-accent px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
              Log application
            </button>
          </form>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {appList.length === 0 && (
            <p className="text-[13px] text-text-tertiary">No applications logged.</p>
          )}
          {appList.map((app) => (
            <div key={app.id} className="rounded-[7px] border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                <span className="text-text-secondary">
                  Created {new Date(app.created_at).toLocaleDateString()} · resume v
                  {app.resume_version}
                  {app.tailored_resume_path && (
                    <span className="ml-1 font-mono text-[11px] text-text-tertiary">
                      ({app.tailored_resume_path})
                    </span>
                  )}
                </span>
                {applicationFollowUpDue(app, role) && (
                  <span className="rounded-[3px] bg-danger-subtle px-2 py-0.5 text-[11px] font-semibold text-danger">
                    follow-up due ({app.follow_up_due_days}d silence)
                  </span>
                )}
              </div>
              <form action={updateApplication} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="application_id" value={app.id} />
                <input type="hidden" name="role_id" value={role.id} />
                <label className="text-xs text-text-tertiary">
                  Stage
                  <input
                    name="stage"
                    defaultValue={app.stage}
                    className="mt-1 block w-32 rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
                  />
                </label>
                <label className="grow text-xs text-text-tertiary">
                  Next action
                  <input
                    name="next_action"
                    defaultValue={app.next_action ?? ""}
                    className="mt-1 block w-full rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
                  />
                </label>
                <label className="text-xs text-text-tertiary">
                  Due
                  <input
                    type="date"
                    name="next_action_due"
                    defaultValue={app.next_action_due ?? ""}
                    className="mt-1 block rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
                  />
                </label>
                <button className="cursor-pointer rounded-[7px] border border-border-strong px-3 py-1.5 text-[13px] text-text-mid transition-colors hover:bg-surface-muted">
                  Save
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
          LOG INTERACTION
        </h2>
        {appList.length > 0 && (
          <form action={addInteraction} className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="role_id" value={role.id} />
            <input type="hidden" name="application_id" value={appList[appList.length - 1].id} />
            <select
              name="type"
              className="rounded-[7px] border border-border-strong bg-card px-2 py-1.5 text-[13px]"
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              name="summary"
              required
              placeholder="What happened?"
              className="grow rounded-[7px] border border-border-strong px-2 py-1.5 text-[13px]"
            />
            <button className="cursor-pointer rounded-[7px] border border-border-strong px-3 py-1.5 text-[13px] text-text-mid transition-colors hover:bg-surface-muted">
              Log
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
