import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_STATUSES, STATUS_COLORS } from "@/lib/constants";
import {
  applicationFollowUpDue,
  daysSince,
  type Application,
  type Role,
} from "@/lib/types";
import { addRole } from "./actions";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: roles }, { data: applications }] = await Promise.all([
    supabase
      .from("recruiting_roles")
      .select("*")
      .order("date_added", { ascending: false }),
    supabase.from("recruiting_applications").select("*"),
  ]);

  const roleList = (roles ?? []) as Role[];
  const appList = (applications ?? []) as Application[];
  const appsByRole = new Map<string, Application[]>();
  for (const app of appList) {
    appsByRole.set(app.role_id, [...(appsByRole.get(app.role_id) ?? []), app]);
  }

  const overdue = roleList.filter((role) =>
    (appsByRole.get(role.id) ?? []).some((app) =>
      applicationFollowUpDue(app, role)
    )
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-lg font-semibold">Pipeline</h1>
          <p className="text-sm text-slate-500">
            {roleList.length} roles tracked
          </p>
        </div>
        <form
          action={addRole}
          className="flex flex-wrap items-center justify-end gap-2"
        >
          <input
            name="company"
            required
            placeholder="Company"
            className="w-36 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          />
          <input
            name="title"
            required
            placeholder="Role title"
            className="w-48 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          />
          <button className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Add role
          </button>
        </form>
      </div>

      {overdue.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-medium">Follow-up due:</span>{" "}
          {overdue.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <Link href={`/roles/${r.id}`} className="underline">
                {r.company} — {r.title}
              </Link>
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {ROLE_STATUSES.map((status) => {
          const inColumn = roleList.filter((r) => r.status === status);
          return (
            <div key={status} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status]}`}
                >
                  {status}
                </span>
                <span className="text-xs text-slate-400">
                  {inColumn.length}
                </span>
              </div>
              <div className="space-y-2">
                {inColumn.map((role) => {
                  const days = daysSince(role.date_applied ?? role.date_added);
                  return (
                    <Link
                      key={role.id}
                      href={`/roles/${role.id}`}
                      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-400"
                    >
                      <div className="text-sm font-medium">{role.company}</div>
                      <div className="mt-0.5 text-sm text-slate-600">
                        {role.title}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {role.date_applied ? "applied" : "added"} {days}d ago
                        {(appsByRole.get(role.id) ?? []).length > 0 &&
                          ` · resume v${Math.max(
                            ...(appsByRole.get(role.id) ?? []).map(
                              (a) => a.resume_version
                            )
                          )}`}
                      </div>
                    </Link>
                  );
                })}
                {inColumn.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-300">
                    empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
