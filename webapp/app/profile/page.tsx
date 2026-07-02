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
          <dt className="w-16 shrink-0 text-xs uppercase tracking-wide text-slate-400">
            {label}
          </dt>
          <dd className="text-slate-600">{text}</dd>
        </div>
      ))}
    </dl>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-slate-400">{label}:</span>
      {items.map((t) => (
        <span
          key={t}
          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-lg font-semibold">Profile Bank</h1>
      <p className="text-sm text-slate-500">
        Read-mostly view — edit via the <code>/profile-bank</code> skill.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">
          Projects ({projectList.length})
        </h2>
        <div className="mt-3 space-y-3">
          {projectList.map((p) => (
            <details
              key={p.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <summary className="cursor-pointer text-sm font-medium">
                {p.title}
                {p.date_range && (
                  <span className="ml-2 font-normal text-slate-400">
                    {p.date_range}
                  </span>
                )}
                {p.summary && (
                  <span className="ml-2 font-normal text-slate-500">
                    — {p.summary}
                  </span>
                )}
              </summary>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {p.problem && (
                  <p>
                    <span className="font-medium text-slate-700">Problem:</span>{" "}
                    {p.problem}
                  </p>
                )}
                {p.approach && (
                  <p>
                    <span className="font-medium text-slate-700">Approach:</span>{" "}
                    {p.approach}
                  </p>
                )}
                {p.impact && (
                  <p>
                    <span className="font-medium text-slate-700">Impact:</span>{" "}
                    {p.impact}
                  </p>
                )}
                {p.repo_url && (
                  <p className="text-xs">
                    <a href={p.repo_url} className="text-slate-400 underline">
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
            <p className="text-sm text-slate-400">
              Empty — run <code>/profile-bank</code> to populate.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">
          Experience ({experienceList.length})
        </h2>
        <div className="mt-3 space-y-3">
          {experienceList.map((e) => (
            <details
              key={e.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <summary className="cursor-pointer text-sm font-medium">
                {e.role} · {e.org}
                {e.date_range && (
                  <span className="ml-2 font-normal text-slate-400">
                    {e.date_range}
                  </span>
                )}
              </summary>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {e.problem && (
                  <p>
                    <span className="font-medium text-slate-700">Problem:</span>{" "}
                    {e.problem}
                  </p>
                )}
                {e.approach && (
                  <p>
                    <span className="font-medium text-slate-700">Approach:</span>{" "}
                    {e.approach}
                  </p>
                )}
                {e.impact && (
                  <p>
                    <span className="font-medium text-slate-700">Impact:</span>{" "}
                    {e.impact}
                  </p>
                )}
              </div>
              <TagRow label="stack" items={e.tech_stack} />
              <TagRow label="tags" items={e.tags} />
              <Bullets item={e} />
            </details>
          ))}
          {experienceList.length === 0 && (
            <p className="text-sm text-slate-400">
              Empty — run <code>/profile-bank</code> to populate.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">
          Skills ({skillList.length})
        </h2>
        <div className="mt-3 space-y-4">
          {SKILL_CATEGORIES.map((cat) => {
            const inCat = skillList.filter((s) => s.category === cat);
            if (inCat.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs uppercase tracking-wide text-slate-400">
                  {cat}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {inCat.map((s) => (
                    <span
                      key={s.id}
                      title={s.source ?? undefined}
                      className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {skillList.length === 0 && (
            <p className="text-sm text-slate-400">
              Empty — run <code>/profile-bank</code> with your resume to
              populate.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
