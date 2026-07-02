# Recruiting OS

Personal recruiting system for Ahmed (single user). Full spec lives in `SPEC.md`.

## Ground rules (apply to every session in this repo)

- **Everything is manual.** No cron, no GitHub Actions, no headless `claude -p`, no Agent SDK, and never set `ANTHROPIC_API_KEY`. All AI work happens in interactive Claude Code sessions Ahmed triggers.
- **No auto-sent email, ever.** Gmail drafts only; Ahmed reviews and sends.
- **No fabricated resume/profile content.** Only reword/reorder real Profile Bank material; never invent metrics or claims.
- **Never delete CRM rows.** Rejected/ghosted roles are retained for pattern analysis.

## Database

Supabase project `dlyombtgtgsavtiqohve` (**mamas-recipes**) — shared with the recipes app.

- Only touch tables/functions prefixed `recruiting_`. Never modify, rename, or drop recipe-app objects (`recipes`, `shortcut_tokens`, `listings`, `get_user_*` functions, etc.).
- Tables: `recruiting_profile_projects`, `recruiting_profile_experience`, `recruiting_profile_skills`, `recruiting_roles`, `recruiting_applications`, `recruiting_contacts`, `recruiting_interactions`. Schema: `supabase/migrations/`.
- RLS is pinned to Ahmed's auth user id `a208e139-3cf1-40ed-aab5-417dc479c585` (email ahmednaserismail6@gmail.com) via `public.recruiting_owner()`. `auth.users` is shared with recipe-app users — never widen policies to all `authenticated`.
- DB access from skills: Supabase MCP `execute_sql`.

## Skills (`.claude/skills/`)

`/profile-bank`, `/recruiting-crm`, `/role-recommend`, `/resume-tailor`, `/recruiting-digest` — each SKILL.md is authoritative for its flow and guardrails.

## Resume

Base template: `resumes/base.tex` (provided by Ahmed — LaTeX). Tailored versions go to `resumes/tailored/`, versioned, never overwritten. Structure/formatting is never edited — bullet content and project-block inclusion only.

## Webapp (`webapp/`)

Next.js (App Router) + `@supabase/ssr`, deployed on Vercel. Auth via the shared Supabase Auth; the app additionally checks the signed-in user is Ahmed (RLS enforces it regardless). Env vars in `webapp/.env.local` (see `webapp/.env.example`).
