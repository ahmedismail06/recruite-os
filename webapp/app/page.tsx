import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BOARD_COLUMNS, STATUS_COLUMN } from "@/lib/constants";
import {
  applicationFollowUpDue,
  contactFollowUpDue,
  daysInStage,
  daysSince,
  freshness,
  isClosedStatus,
  latestApplication,
  type Application,
  type Contact,
  type Interaction,
  type Role,
} from "@/lib/types";
import StageSelect from "@/components/StageSelect";
import PostingLink from "@/components/PostingLink";

export const dynamic = "force-dynamic";

type QueueItem = {
  id: string;
  urgency: "overdue" | "due" | "upcoming";
  label: string;
  meta: string;
  action: string;
  href: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const matches = (text: string) => !query || text.toLowerCase().includes(query);

  const supabase = await createClient();
  const [{ data: roles }, { data: applications }, { data: contacts }, { data: interactions }] =
    await Promise.all([
      supabase.from("recruiting_roles").select("*").order("date_added", { ascending: false }),
      supabase.from("recruiting_applications").select("*"),
      supabase.from("recruiting_contacts").select("*"),
      supabase
        .from("recruiting_interactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5),
    ]);

  const roleList = (roles ?? []) as Role[];
  const appList = (applications ?? []) as Application[];
  const contactList = (contacts ?? []) as Contact[];
  const interactionList = (interactions ?? []) as Interaction[];
  const roleById = new Map(roleList.map((r) => [r.id, r]));
  const appById = new Map(appList.map((a) => [a.id, a]));

  // Watchlist roles (not yet posted) aren't in the pipeline yet — they're
  // surfaced separately via the "Watching" stat, not as board cards.
  const pipelineRoles = roleList.filter((r) => !r.not_yet_posted);

  const cards = pipelineRoles.map((role) => {
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
      match: matches(`${role.company} ${role.title}`),
    };
  });

  // ── Today: action queue ──────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const queue: QueueItem[] = [];

  for (const role of roleList) {
    for (const app of appList.filter((a) => a.role_id === role.id)) {
      if (applicationFollowUpDue(app, role)) {
        const days = daysInStage(role, appList);
        queue.push({
          id: `app-${app.id}`,
          urgency: "overdue",
          label: `${role.company} — ${role.title}`,
          meta: `${days}d silent`,
          action: "Send follow-up",
          href: `/roles/${role.id}`,
        });
      }
    }
  }
  for (const c of contactList) {
    if (contactFollowUpDue(c)) {
      const days = daysSince(c.last_touch_date ?? c.created_at) ?? 0;
      queue.push({
        id: `contact-${c.id}`,
        urgency: "overdue",
        label: `${c.name}${c.company ? ` — ${c.company}` : ""}`,
        meta: `${days}d silent`,
        action: "Nudge",
        href: "/contacts",
      });
    }
  }
  for (const role of roleList) {
    const latest = latestApplication(appList, role.id);
    if (latest?.next_action && latest.next_action_due && latest.next_action_due <= today) {
      const already = queue.some((qi) => qi.href === `/roles/${role.id}`);
      if (!already) {
        queue.push({
          id: `due-${latest.id}`,
          urgency: "due",
          label: `${role.company} — ${role.title}`,
          meta: `Due today: ${latest.next_action}`,
          action: "Open role",
          href: `/roles/${role.id}`,
        });
      }
    }
  }
  for (const role of roleList) {
    if (role.status !== "screening" && role.status !== "interviewing") continue;
    const latest = latestApplication(appList, role.id);
    const alreadyQueued = queue.some((qi) => qi.href === `/roles/${role.id}`);
    if (alreadyQueued) continue;
    queue.push({
      id: `upcoming-${role.id}`,
      urgency: "upcoming",
      label: `${role.company} — ${role.title}`,
      meta: latest?.next_action ?? `In ${role.status}`,
      action: "View role",
      href: `/roles/${role.id}`,
    });
  }
  const filteredQueue = queue.filter((item) => matches(item.label));

  // ── Vital signs ───────────────────────────────────────────────
  const activeRoles = pipelineRoles.filter((r) => !isClosedStatus(r.status));
  const inInterview = pipelineRoles.filter(
    (r) => r.status === "screening" || r.status === "interviewing"
  );
  const appliedOrLater = pipelineRoles.filter((r) => r.status !== "interested");
  const respondedCount = appliedOrLater.filter((r) => r.status !== "applied").length;
  const responseRate = appliedOrLater.length
    ? Math.round((respondedCount / appliedOrLater.length) * 100)
    : 0;
  const medianDays = (() => {
    const arr = activeRoles.map((r) => daysInStage(r, appList)).sort((a, b) => a - b);
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
  })();
  const addedThisWeek = roleList.filter((r) => (daysSince(r.date_added) ?? 99) <= 7).length;
  const watchingCount = roleList.filter((r) => r.not_yet_posted).length;

  const stats = [
    { label: "Active applications", value: String(activeRoles.length) },
    { label: "In interview stages", value: String(inInterview.length) },
    { label: "Response rate", value: `${responseRate}%` },
    { label: "Median days in stage", value: `${medianDays}d` },
    { label: "Added this week", value: String(addedThisWeek) },
    { label: "Watching (not yet posted)", value: String(watchingCount) },
  ];

  // ── Pipeline columns ─────────────────────────────────────────
  const columns = BOARD_COLUMNS.map((col) => {
    const inColumn = cards.filter((c) => STATUS_COLUMN[c.role.status] === col.key);
    if (col.key === "closed") {
      return { ...col, cards: inColumn, count: inColumn.length, isEmpty: false };
    }
    const filtered = inColumn.filter((c) => c.match);
    return { ...col, cards: filtered, count: filtered.length, isEmpty: filtered.length === 0 };
  });

  // ── Activity strip ───────────────────────────────────────────
  const activity = interactionList.map((it) => {
    let label: string = it.type;
    if (it.contact_id) {
      const contact = contactList.find((c) => c.id === it.contact_id);
      if (contact) label = `${it.type} — ${contact.name}`;
    } else if (it.application_id) {
      const app = appById.get(it.application_id);
      const role = app ? roleById.get(app.role_id) : undefined;
      if (role) label = `${it.type} — ${role.company}`;
    }
    const days = daysSince(it.date) ?? 0;
    return { id: it.id, label, time: days === 0 ? "today" : `${days}d ago` };
  });

  return (
    <div className="flex flex-col gap-8 px-7 pt-8 pb-6">
      <div className="flex items-stretch gap-6">
        <div className="min-w-0 flex-[2.1]">
          <div className="mb-3 font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
            TODAY
          </div>
          {filteredQueue.length > 0 ? (
            <div>
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-3.5 border-b border-border-soft px-1.5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <Link
                    href={item.href}
                    aria-label={`${item.action}: ${item.label}`}
                    className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  />
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{
                      background:
                        item.urgency === "overdue"
                          ? "var(--color-danger)"
                          : item.urgency === "due"
                            ? "var(--color-warning-dot)"
                            : "var(--color-upcoming)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary">{item.label}</div>
                    <div className="mt-0.5 font-mono text-[11.5px] text-text-tertiary">
                      {item.meta}
                    </div>
                  </div>
                  <span className="flex-none text-[12.5px] font-semibold text-accent transition-transform group-hover:translate-x-0.5">
                    {item.action} →
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-1.5 py-6 text-sm text-text-secondary">
              Nothing due. Go find something with{" "}
              <span className="font-mono text-text-primary">/role-scout</span>.
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-lg border border-border-soft bg-surface-muted p-[18px]">
          <div className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
            THIS WEEK
          </div>
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline justify-between border-b border-border-soft pb-3"
            >
              <span className="text-xs text-text-secondary">{s.label}</span>
              <span className="font-mono text-base font-semibold text-text-primary">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
          PIPELINE
        </div>
        <div className="flex items-start gap-3.5">
          {columns.map((col) =>
            col.key === "closed" ? (
              <ClosedColumn key={col.key} cards={col.cards} />
            ) : col.isEmpty ? (
              <div
                key={col.key}
                className="flex h-[140px] w-10 flex-none flex-col items-center gap-2.5 rounded-[7px] border border-border bg-surface-muted py-3"
              >
                <span
                  className="text-[11px] font-semibold text-text-tertiary"
                  style={{ writingMode: "vertical-rl", letterSpacing: "0.04em" }}
                >
                  {col.label}
                </span>
                <span className="font-mono text-[10.5px] text-text-quaternary">0</span>
              </div>
            ) : (
              <div key={col.key} className="min-w-0 flex-1">
                <div className="mb-2.5 flex items-baseline gap-[7px] px-0.5">
                  <span className="text-[12.5px] font-semibold text-text-primary">
                    {col.label}
                  </span>
                  <span className="font-mono text-[11.5px] text-text-tertiary">
                    · {col.count}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.cards.map((c) => (
                    <RoleCard key={c.role.id} card={c} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {activity.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
          <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
            ACTIVITY
          </span>
          {activity.map((a) => (
            <span key={a.id} className="text-[12.5px] text-text-secondary">
              {a.label} <span className="font-mono text-text-quaternary">· {a.time}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  card,
}: {
  card: {
    role: Role;
    days: number;
    fresh: "fresh" | "aging" | "stale";
    followUpDue: boolean;
    tailored: boolean;
  };
}) {
  const { role, days, fresh, followUpDue, tailored } = card;
  return (
    <div className="group relative rounded-[7px] border border-border bg-card p-3 transition-colors hover:border-border-strong">
      <Link
        href={`/roles/${role.id}`}
        aria-label={`${role.company} — ${role.title}`}
        className="absolute inset-0 rounded-[7px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      />
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="min-w-0 truncate text-[13.5px] font-semibold text-text-primary transition-colors group-hover:text-accent">
          {role.company}
        </span>
        <div className="relative z-10 flex flex-none items-center gap-1">
          {role.posting_url && (
            <PostingLink url={role.posting_url} className="h-5 w-5" />
          )}
          <StageSelect roleId={role.id} status={role.status} />
        </div>
      </div>
      <div className="mt-0.5 text-[12.5px] text-text-secondary">{role.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`font-mono text-[10.5px] ${
            fresh === "stale"
              ? "font-semibold text-danger"
              : fresh === "aging"
                ? "text-warning"
                : "text-text-tertiary"
          }`}
        >
          {days}d in stage
        </span>
        {followUpDue && (
          <span className="rounded-[3px] bg-danger-subtle px-1.5 py-0.5 text-[10px] font-semibold text-danger">
            follow-up due
          </span>
        )}
        {tailored && (
          <span className="rounded-[3px] bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
            tailored
          </span>
        )}
      </div>
    </div>
  );
}

function ClosedColumn({ cards }: { cards: { role: Role; days: number }[] }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2.5 flex items-baseline gap-[7px] px-0.5">
        <span className="text-[12.5px] font-semibold text-text-primary">Closed</span>
        <span className="font-mono text-[11.5px] text-text-tertiary">· {cards.length}</span>
      </div>
      <details>
        <summary className="mb-2 cursor-pointer list-none rounded-[7px] border border-dashed border-border-strong py-[11px] text-center text-[12.5px] text-text-tertiary">
          Show closed roles ({cards.length})
        </summary>
        <div className="flex flex-col gap-2">
          {cards.map((c) => (
            <Link
              key={c.role.id}
              href={`/roles/${c.role.id}`}
              className="block rounded-[7px] border border-border-soft bg-surface-muted p-2.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <div className="text-[13px] font-medium text-text-mid">{c.role.company}</div>
              <div className="mt-0.5 text-xs text-text-tertiary">{c.role.title}</div>
              <div className="mt-1.5 font-mono text-[10.5px] text-text-quaternary">
                {c.role.status} · {c.days}d
              </div>
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
