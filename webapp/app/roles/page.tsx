import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markRolePosted } from "@/app/actions";
import { STATUS_LABELS } from "@/lib/constants";
import PostingLink from "@/components/PostingLink";
import {
  applicationFollowUpDue,
  daysInStage,
  daysSince,
  freshness,
  isClosedStatus,
  latestApplication,
  type Application,
  type Role,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const matches = (text: string) => !query || text.toLowerCase().includes(query);

  const supabase = await createClient();
  const [{ data: roles }, { data: applications }] = await Promise.all([
    supabase.from("recruiting_roles").select("*").order("date_added", { ascending: false }),
    supabase.from("recruiting_applications").select("*"),
  ]);
  const roleList = (roles ?? []) as Role[];
  const appList = (applications ?? []) as Application[];

  const watchlist = roleList
    .filter((r) => r.not_yet_posted)
    .sort((a, b) => a.company.localeCompare(b.company));

  // Watchlist roles live in their own section above — keep them out of the
  // main list so they're not shown twice.
  const listable = roleList.filter((r) => !r.not_yet_posted);

  const rows = listable
    .filter((r) => matches(`${r.company} ${r.title}`))
    .map((role) => {
      const days = daysInStage(role, appList);
      const latest = latestApplication(appList, role.id);
      const followUpDue = appList
        .filter((a) => a.role_id === role.id)
        .some((a) => applicationFollowUpDue(a, role));
      return {
        role,
        days,
        fresh: freshness(days),
        followUpDue,
        tailored: Boolean(latest?.tailored_resume_path),
      };
    })
    .sort((a, b) => {
      const closedA = isClosedStatus(a.role.status);
      const closedB = isClosedStatus(b.role.status);
      if (closedA !== closedB) return closedA ? 1 : -1;
      return a.days - b.days;
    });

  return (
    <div className="px-7 pt-8 pb-6">
      <div className="mb-[18px] flex items-baseline gap-2.5">
        <span className="text-xl font-semibold text-text-primary">Roles</span>
        <span className="font-mono text-[13px] text-text-tertiary">
          {listable.length} total
        </span>
      </div>

      {watchlist.length > 0 && (
        <div className="mb-6 rounded-lg border border-border-soft bg-surface-muted p-[18px]">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
              WATCHLIST
            </span>
            <span className="font-mono text-[11.5px] text-text-tertiary">
              · {watchlist.length} not yet posted
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {watchlist.map((role) => {
              const checkedDays = daysSince(role.last_checked_at);
              return (
                <div
                  key={role.id}
                  className="flex items-center gap-3 rounded-[7px] border border-border-soft bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-text-primary">
                      {role.company}
                    </div>
                    <div className="mt-0.5 text-xs text-text-secondary">{role.title}</div>
                  </div>
                  <div className="flex-none font-mono text-[11px] text-text-tertiary">
                    {checkedDays === null
                      ? "not checked yet"
                      : checkedDays === 0
                        ? "checked today"
                        : `checked ${checkedDays}d ago`}
                  </div>
                  <div className="flex flex-none items-center gap-1.5">
                    {role.posting_url && <PostingLink url={role.posting_url} />}
                    <form action={markRolePosted}>
                      <input type="hidden" name="role_id" value={role.id} />
                      <button className="h-7 cursor-pointer rounded-[5px] border border-border-strong px-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent">
                        Mark posted
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex h-[34px] items-center gap-0 border-b border-border-strong px-3">
        <span className="flex-[2.4] text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          COMPANY / ROLE
        </span>
        <span className="flex-1 text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          STAGE
        </span>
        <span className="flex-1 text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          DAYS IN STAGE
        </span>
        <span className="flex-1 text-[11px] font-semibold tracking-[0.05em] text-text-tertiary">
          FLAGS
        </span>
        <span className="w-9 flex-none" aria-hidden="true" />
      </div>

      {rows.map((r) => (
        <div
          key={r.role.id}
          className="group relative flex items-center gap-0 border-b border-border-soft p-3 transition-colors hover:bg-surface-muted"
        >
          <Link
            href={`/roles/${r.role.id}`}
            aria-label={`${r.role.company} — ${r.role.title}`}
            className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
          <div className="min-w-0 flex-[2.4]">
            <div className="text-[13.5px] font-semibold text-text-primary transition-colors group-hover:text-accent">
              {r.role.company}
            </div>
            <div className="mt-0.5 text-xs text-text-secondary">{r.role.title}</div>
          </div>
          <div className="flex-1">
            <span className="rounded-[4px] bg-surface-muted px-2 py-0.5 text-[11.5px] font-medium text-text-mid">
              {STATUS_LABELS[r.role.status]}
            </span>
          </div>
          <div className="flex-1 font-mono text-xs">
            <span
              className={
                r.fresh === "stale"
                  ? "font-semibold text-danger"
                  : r.fresh === "aging"
                    ? "text-warning"
                    : "text-text-tertiary"
              }
            >
              {r.days}d
            </span>
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {r.followUpDue && (
              <span className="rounded-[3px] bg-danger-subtle px-1.5 py-0.5 text-[9.5px] font-semibold text-danger">
                follow-up due
              </span>
            )}
            {r.tailored && (
              <span className="rounded-[3px] bg-surface-muted px-1.5 py-0.5 text-[9.5px] font-semibold text-text-secondary">
                tailored
              </span>
            )}
          </div>
          <div className="flex w-9 flex-none justify-end">
            {r.role.posting_url && <PostingLink url={r.role.posting_url} />}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="py-6 text-sm text-text-secondary">No roles match.</p>
      )}
    </div>
  );
}
