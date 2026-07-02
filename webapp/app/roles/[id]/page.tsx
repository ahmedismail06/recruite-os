import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  INTERACTION_TYPES,
  ROLE_STATUSES,
  STATUS_COLORS,
} from "@/lib/constants";
import {
  applicationFollowUpDue,
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
  updateRoleStatus,
} from "@/app/actions";

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

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-700">
        ← Pipeline
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {role.company} — {role.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Added {new Date(role.date_added).toLocaleDateString()}
            {role.date_applied &&
              ` · applied ${new Date(role.date_applied).toLocaleDateString()}`}
            {" · "}source: {role.source}
          </p>
        </div>
        <form action={updateRoleStatus} className="flex items-center gap-2">
          <input type="hidden" name="role_id" value={role.id} />
          <select
            name="status"
            defaultValue={role.status}
            className={`rounded-md border border-slate-300 px-2 py-1.5 text-sm capitalize ${STATUS_COLORS[role.status]}`}
          >
            {ROLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            Update
          </button>
        </form>
      </div>

      {/* Fit rationale */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">Fit rationale</h2>
        <form action={updateFitRationale} className="mt-2">
          <input type="hidden" name="role_id" value={role.id} />
          <textarea
            name="fit_rationale"
            defaultValue={role.fit_rationale ?? ""}
            rows={4}
            placeholder="No fit rationale yet — run /role-recommend or write one here."
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"
          />
          <button className="mt-2 cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            Save rationale
          </button>
        </form>
      </section>

      {/* Applications */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Applications
          </h2>
          <form action={logApplication}>
            <input type="hidden" name="role_id" value={role.id} />
            <button className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              Log application
            </button>
          </form>
        </div>
        <div className="mt-3 space-y-3">
          {appList.length === 0 && (
            <p className="text-sm text-slate-400">No applications logged.</p>
          )}
          {appList.map((app) => (
            <div
              key={app.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">
                  Created {new Date(app.created_at).toLocaleDateString()} ·
                  resume v{app.resume_version}
                  {app.tailored_resume_path && (
                    <span className="ml-1 font-mono text-xs text-slate-400">
                      ({app.tailored_resume_path})
                    </span>
                  )}
                </span>
                {applicationFollowUpDue(app, role) && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    follow-up due ({app.follow_up_due_days}d silence)
                  </span>
                )}
              </div>
              <form
                action={updateApplication}
                className="mt-3 flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="application_id" value={app.id} />
                <input type="hidden" name="role_id" value={role.id} />
                <label className="text-xs text-slate-500">
                  Stage
                  <input
                    name="stage"
                    defaultValue={app.stage}
                    className="mt-1 block w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="grow text-xs text-slate-500">
                  Next action
                  <input
                    name="next_action"
                    defaultValue={app.next_action ?? ""}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Due
                  <input
                    type="date"
                    name="next_action_due"
                    defaultValue={app.next_action_due ?? ""}
                    className="mt-1 block rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <button className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
                  Save
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Interactions */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">Interactions</h2>
        {appList.length > 0 && (
          <form
            action={addInteraction}
            className="mt-2 flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="role_id" value={role.id} />
            <input
              type="hidden"
              name="application_id"
              value={appList[appList.length - 1].id}
            />
            <select
              name="type"
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
              className="grow rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
              Log
            </button>
          </form>
        )}
        <ul className="mt-3 space-y-2">
          {interactionList.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {it.type} · {new Date(it.date).toLocaleDateString()}
              </span>
              <p className="mt-0.5">{it.summary}</p>
            </li>
          ))}
          {interactionList.length === 0 && (
            <li className="text-sm text-slate-400">No interactions yet.</li>
          )}
        </ul>
      </section>

      {/* Contacts */}
      {contactList.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700">
            Linked contacts
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {contactList.map((c) => (
              <li key={c.id}>
                <Link href="/contacts" className="text-slate-700 underline">
                  {c.name}
                </Link>{" "}
                {c.email && <span className="text-slate-400">{c.email}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* JD */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">
          Job description
        </h2>
        <pre className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-xs whitespace-pre-wrap text-slate-600">
          {role.jd_text ?? "No JD stored."}
        </pre>
      </section>
    </main>
  );
}
