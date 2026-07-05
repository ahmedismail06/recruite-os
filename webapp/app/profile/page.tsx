import { createClient } from "@/lib/supabase/server";
import type {
  ProfileExperience,
  ProfileProject,
  ProfileSkill,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const SKILL_CATEGORIES = [
  "language",
  "framework",
  "tool",
  "coursework",
  "cert",
] as const;

function Bullets({
  item,
}: {
  item: Pick<ProfileProject, "bullet_short" | "bullet_medium" | "bullet_detailed">;
}) {
  const variants = [
    ["short", item.bullet_short],
    ["medium", item.bullet_medium],
    ["detailed", item.bullet_detailed],
  ].filter(([, v]) => v);
  if (variants.length === 0) return null;
  return (
    <dl className="mt-3 space-y-1">
      {variants.map(([label, text]) => (
        <div key={label} className="flex gap-2 text-sm">
          <dt className="w-16 shrink-0 text-xs tracking-wide text-text-tertiary uppercase">
            {label}
          </dt>
          <dd className="text-text-mid">{text}</dd>
        </div>
      ))}
    </dl>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-text-tertiary">{label}:</span>
      {items.map((t) => (
        <span
          key={t}
          className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-mid"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: experience }, { data: skills }] =
    await Promise.all([
      supabase.from("recruiting_profile_projects").select("*").order("title"),
      supabase.from("recruiting_profile_experience").select("*").order("org"),
      supabase.from("recruiting_profile_skills").select("*").order("name"),
    ]);

  const projectList = (projects ?? []) as ProfileProject[];
  const experienceList = (experience ?? []) as ProfileExperience[];
  const skillList = (skills ?? []) as ProfileSkill[];

  return (
    <div className="px-7 pt-8 pb-6">
      <div className="text-xl font-semibold text-text-primary">Profile bank</div>
      <p className="mt-1 text-[13px] text-text-secondary">
        Read-mostly view — edit via the <code className="font-mono">/profile-bank</code> skill.
      </p>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
          PROJECTS ({projectList.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {projectList.map((p) => (
            <details key={p.id} className="rounded-[7px] border border-border p-4">
              <summary className="cursor-pointer text-[13.5px] font-medium text-text-primary">
                {p.title}
                {p.date_range && (
                  <span className="ml-2 font-normal text-text-tertiary">{p.date_range}</span>
                )}
                {p.summary && (
                  <span className="ml-2 font-normal text-text-secondary">— {p.summary}</span>
                )}
              </summary>
              <div className="mt-3 space-y-2 text-[13px] text-text-mid">
                {p.problem && (
                  <p>
                    <span className="font-medium text-text-primary">Problem:</span> {p.problem}
                  </p>
                )}
                {p.approach && (
                  <p>
                    <span className="font-medium text-text-primary">Approach:</span> {p.approach}
                  </p>
                )}
                {p.impact && (
                  <p>
                    <span className="font-medium text-text-primary">Impact:</span> {p.impact}
                  </p>
                )}
                {p.repo_url && (
                  <p className="text-xs">
                    <a href={p.repo_url} className="text-text-tertiary underline">
                      {p.repo_url}
                    </a>
                  </p>
                )}
              </div>
              <TagRow label="stack" items={p.tech_stack} />
              <TagRow label="tags" items={p.tags} />
              <Bullets item={p} />
            </details>
          ))}
          {projectList.length === 0 && (
            <p className="text-[13px] text-text-tertiary">
              Empty — run <code className="font-mono">/profile-bank</code> to populate.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
          EXPERIENCE ({experienceList.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {experienceList.map((e) => (
            <details key={e.id} className="rounded-[7px] border border-border p-4">
              <summary className="cursor-pointer text-[13.5px] font-medium text-text-primary">
                {e.role} · {e.org}
                {e.date_range && (
                  <span className="ml-2 font-normal text-text-tertiary">{e.date_range}</span>
                )}
              </summary>
              <div className="mt-3 space-y-2 text-[13px] text-text-mid">
                {e.problem && (
                  <p>
                    <span className="font-medium text-text-primary">Problem:</span> {e.problem}
                  </p>
                )}
                {e.approach && (
                  <p>
                    <span className="font-medium text-text-primary">Approach:</span> {e.approach}
                  </p>
                )}
                {e.impact && (
                  <p>
                    <span className="font-medium text-text-primary">Impact:</span> {e.impact}
                  </p>
                )}
              </div>
              <TagRow label="stack" items={e.tech_stack} />
              <TagRow label="tags" items={e.tags} />
              <Bullets item={e} />
            </details>
          ))}
          {experienceList.length === 0 && (
            <p className="text-[13px] text-text-tertiary">
              Empty — run <code className="font-mono">/profile-bank</code> to populate.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-tertiary">
          SKILLS ({skillList.length})
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {SKILL_CATEGORIES.map((cat) => {
            const inCat = skillList.filter((s) => s.category === cat);
            if (inCat.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs tracking-wide text-text-tertiary uppercase">{cat}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {inCat.map((s) => (
                    <span
                      key={s.id}
                      title={s.source ?? undefined}
                      className="rounded-full bg-card px-2.5 py-1 text-xs text-text-mid ring-1 ring-border"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {skillList.length === 0 && (
            <p className="text-[13px] text-text-tertiary">
              Empty — run <code className="font-mono">/profile-bank</code> with your resume to
              populate.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
