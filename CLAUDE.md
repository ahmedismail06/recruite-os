# Recruiting OS

Personal recruiting system (single user). Full spec lives in `SPEC.md`. First-time setup runs
through the `/setup` skill.

## Ground rules (apply to every session in this repo)

- **Everything is manual.** No cron, no GitHub Actions, no headless `claude -p`, no Agent SDK, and never set `ANTHROPIC_API_KEY`. All AI work happens in interactive Claude Code sessions you trigger.
- **No auto-sent email, ever.** Gmail drafts only; you review and send.
- **No fabricated resume/profile content.** Only reword/reorder real Profile Bank material; never invent metrics or claims.
- **Never delete CRM rows.** Rejected/ghosted roles are retained for pattern analysis.

## Storage

Storage is backend-agnostic — every skill resolves it from `recruiting-os.config.json` at the repo
root, per `STORAGE.md`. Two backends:

- **`local`** — data lives in markdown files under `data/` (git-ignored). No database.
- **`supabase`** — data lives in the `recruiting_`-prefixed tables in your own Supabase project;
  skills reach it via the Supabase MCP `execute_sql`. The webapp is Supabase-only.

Tables (supabase mode): `recruiting_profile_projects`, `recruiting_profile_experience`, `recruiting_profile_skills`, `recruiting_roles`, `recruiting_applications`, `recruiting_contacts`, `recruiting_interactions`, `recruiting_tracked_companies`, `recruiting_seen_postings`. Schema: `supabase/migrations/` (bundled into `supabase/schema.sql` by `scripts/setup.mjs`).

- **Only touch `recruiting_`-prefixed objects.** If your Supabase project is shared with other apps, never modify, rename, or drop their objects, and never widen RLS policies to all `authenticated`.
- RLS: owner access is scoped through `public.recruiting_owner()`. The webapp/skills connect with the secret key (bypasses RLS) and the `recruiting anon local access` policies grant the no-login app access, so the owner id baked into that function is a legacy no-op — don't rely on it for access control.

## Skills (`.claude/skills/`)

`/setup`, `/profile-bank`, `/recruiting-crm`, `/role-recommend`, `/role-scout`, `/ats-scan`, `/resume-tailor`, `/cover-letter`, `/recruiter-finder`, `/recruiting-digest` — each SKILL.md is authoritative for its flow and guardrails.

`ats-scan` is a structured complement to `role-scout`'s thesis-based web search: it polls the public Greenhouse/Lever/Ashby job-board APIs for a maintained company watchlist via `scripts/ats-scan.mjs` (fetch-only, no storage access) and dedupes against everything already seen before proposing new roles.

`mcp/skills-server/` exposes these same skills over MCP (registered at user scope via `claude mcp add`) as `/mcp__recruiting-skills__*` prompts and `list_skills`/`get_skill` tools, plus `db_select`/`db_insert`/`db_update` tools scoped to the `recruiting_` tables (no delete tool — CRM rows are never deleted; supabase mode only). See its README. The server performs no AI or email work itself.

## Application review (`.claude/agents/application-reviewer.md`)

A read-only subagent that `resume-tailor` and `cover-letter` invoke (via the Agent tool) after
drafting and before writing a file — an independent critique pass for fabrication, structural
drift, JD alignment, redundancy, and length. Blocking issues (fabrication, structural drift) must
be fixed; other suggestions are the drafting skill's judgment call. Still one interactive session
you trigger, not a background process.

## Resume

Base template: `resumes/base.tex` (you provide it — LaTeX). Tailored versions go to `resumes/tailored/`, versioned, never overwritten. Structure/formatting is never edited — bullet content and project-block inclusion only.

## Webapp (`webapp/`)

Next.js (App Router), Supabase-only. **No login** (removed 2026-07-01): all DB access is server-side using the project secret key (`SUPABASE_SECRET_KEY` in `webapp/.env.local`, see `.env.example`), which bypasses RLS. Never expose that key to the browser, and never deploy the app publicly without access protection (e.g. Vercel Deployment Protection) — anyone who can reach it can edit the data.
