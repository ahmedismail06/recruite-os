---
name: setup
description: First-run setup AND usage guide for Recruiting OS. Walks a newly-cloned user interactively through choosing a storage backend (Supabase or local .md files), installing dependencies, configuring env/credentials, registering the skills MCP server, personalizing (their name), and enabling optional integrations — and also answers "how do I use this / what does <skill> do / how do I <task>" questions so nobody has to ask the original author. Use when someone clones the repo, asks how to get started, run setup, configure, personalize, or how to use any part of the system.
---

# setup

This skill does two jobs: **(A) first-run configuration** and **(B) answering usage/how-to
questions** — so a friend who cloned the repo never has to ask the original author anything.

Figure out which the user needs from their message:
- "set up / get started / configure / personalize" → run the **Setup flow** (sections 0–7).
- "how do I use this / what does X do / how do I <task> / help" → jump to **§8 Usage & help**.

Everything here runs inside this one interactive session — no cron, no headless runs, no
`ANTHROPIC_API_KEY` (that rule holds for the whole system). Present each stage as a **choice**, wait
for the user, then act. Never assume a backend or silently skip a step. Show the exact command
you're about to run.

## 0. Orient

1. Read `recruiting-os.config.json` at the repo root.
   - If it exists, tell the user setup was already run (show the current `storage` + options) and ask
     whether they want to reconfigure, or jump to a specific stage. Don't clobber their config
     silently.
   - If it doesn't exist, continue — this is a first run.
2. One-line recap of what Recruiting OS is (Profile Bank + CRM + resume/cover-letter tailoring +
   email watchdog, all driven by skills in interactive Claude Code sessions) and that setup takes a
   couple minutes.

## 1. Choose a storage backend (the big fork)

Ask the user to pick, and explain the tradeoff plainly:

- **Local `.md` files** — zero external accounts. All data lives in markdown files under `data/`
  (git-ignored). Every skill works. No webapp (there's no database to serve). Best for trying it out
  or keeping everything on your own machine.
- **Supabase** — a free Supabase project backs the data. Everything local mode does, **plus** the
  Next.js webapp (pipeline board, contacts, profile viewer). Needs a Supabase account (~5 min).

Record the choice; it drives the rest. The schema of both backends is identical — see `STORAGE.md`.

## 2. Prerequisites

Confirm Node 18+ (20+ recommended): `node -v`. If older, ask them to upgrade before continuing
(the webapp and MCP server need it). Note LaTeX (`pdflatex`/`tectonic`) is **optional** — only
needed if they later want `resume-tailor` / `cover-letter` to compile PDFs; the skills produce
`.tex` either way.

## 3. Run the mechanical helper

Run the dependency-free helper, passing the chosen backend:

```sh
node scripts/setup.mjs --storage=<local|supabase>
```

It bundles the migrations into `supabase/schema.sql`, installs webapp + MCP-server deps, scaffolds
`webapp/.env.local`, creates the `data/` scaffold, and writes `recruiting-os.config.json`. Relay its
output. If `npm install` fails (e.g. no network), note it and let them re-run later with
`--skip-install`.

## 4. Backend-specific configuration

### If Supabase
1. Have them create a **new, empty** Supabase project at https://supabase.com (Free tier is fine).
   It does **not** need to be shared with anything — a standalone project is simplest.
2. Apply the schema: open the project's **SQL Editor**, paste the contents of `supabase/schema.sql`,
   Run. That creates all `recruiting_` tables in one shot. (Alternative, if they have the Supabase
   MCP pointed at their project: apply each `supabase/migrations/*.sql` in filename order via
   `apply_migration`.) The hardcoded owner id in the schema is harmless legacy — the app connects
   with the secret key, which bypasses RLS.
3. Collect credentials into `webapp/.env.local` (already scaffolded): `SUPABASE_URL` (Project URL),
   `SUPABASE_SECRET_KEY` (Project API keys → secret/service key), and `APP_PASSWORD` (any strong
   password — gates the deployed webapp via Basic Auth). Also set `supabase.project_ref` in
   `recruiting-os.config.json`. **Never** put the secret key anywhere the browser can see it, and
   never deploy the webapp publicly without access protection.
4. For skills to reach the DB, they need the **Supabase MCP** configured in their Claude Code,
   pointed at this project. Point them to Supabase's MCP docs if it isn't set up.
5. Offer to launch the webapp: `cd webapp && npm run dev` → http://localhost:3000.

### If Local
Nothing else to configure — the helper already created `data/`. Confirm the layout matches
`STORAGE.md` and that this is where their data will live. Remind them `data/` is git-ignored, so it
stays private and never gets committed.

## 5. Register the skills MCP server

This is what makes `/setup` and the other skills available as slash commands in every session.
Show the exact command the helper printed (it resolves **this clone's** absolute path):

```sh
claude mcp add --scope user recruiting-skills -- node <ABS>/mcp/skills-server/server.mjs
```

If they're already reading this via that server, it's registered — confirm and move on.

## 6. Optional integrations ("option for everything")

Offer each, opt-in — none are required for the core CRM/profile/resume flows:

- **Gmail MCP** — enables `recruiting-digest` (scan Gmail for recruiting threads, draft — never send
  — follow-ups). Set `options.gmail = true` if they want it and have the Gmail MCP configured.
- **Browser MCP (claude-in-chrome)** — enables `recruiter-finder` (find recruiters on LinkedIn from
  their own logged-in session). Set `options.browser = true`.
- **Webapp** (Supabase mode only) — set `options.webapp = true` if they'll run/deploy it.

Update `recruiting-os.config.json` with whatever they enable.

## 7. Personalize + first run + handoff

1. **Personalize.** Ask the user's name and write it to `owner_name` in `recruiting-os.config.json`.
   The repo ships identity-neutral (skills say "the user"/"you"), so this is the one place a name
   lives; it's optional flavor, not load-bearing. Their real name on resumes/cover letters comes
   from their own `resumes/base.tex` / `cover-letters/base.tex`, which they provide.
2. Write/confirm the final `recruiting-os.config.json`, then show a short "you're ready" summary and
   the natural first steps:
   - `/profile-bank` — ingest their resume and add a project or two (this fills the Profile Bank that
     resume/cover-letter tailoring draws from).
   - `/recruiting-crm` — paste a job description to add the first role.
   - Mention the rest by name: `/role-recommend`, `/role-scout`, `/ats-scan`, `/resume-tailor`,
     `/cover-letter`, `/recruiter-finder`, `/recruiting-digest`.
   - Tell them they can come back to `/setup` any time and just ask "how do I …" (see §8).

## 8. Usage & help (answer how-to questions)

When the user asks how to use the system or a specific skill — instead of (or after) setup —
orient them. You don't need to run the setup flow for this.

- **"What can this do / what are the skills?"** — give the one-line-each rundown: `/profile-bank`
  (build your Profile Bank from your resume/repos), `/recruiting-crm` (track roles, applications,
  contacts, follow-ups), `/role-recommend` (is this role a fit?), `/role-scout` (discover roles from
  a thesis), `/ats-scan` (scan tracked companies' job boards), `/resume-tailor` (tailor your LaTeX
  resume to a JD), `/cover-letter` (draft a JD-tailored cover letter), `/recruiter-finder` (find
  recruiters on LinkedIn), `/recruiting-digest` (scan Gmail, draft follow-ups).
- **"How do I <specific task>?"** — map it to the right skill and walk them through it. For the exact
  flow/guardrails, read that skill's `SKILL.md` (or call the `get_skill` tool), then explain in
  plain terms. Common maps: *add a job I found* → `/recruiting-crm`; *I applied somewhere* →
  `/recruiting-crm`; *tailor my resume* → `/resume-tailor`; *is this worth applying to* →
  `/role-recommend`; *what should I follow up on* → `/recruiting-crm` (follow-up check) or
  `/recruiting-digest`.
- **"Where does my data live?"** — read `recruiting-os.config.json`: local mode → markdown under
  `data/` (see `STORAGE.md`); supabase mode → the `recruiting_` tables + the webapp at
  `cd webapp && npm run dev`.
- **"Something isn't configured"** (e.g. a skill says a backend/MCP is missing) — point them back to
  the relevant setup section (§1 backend, §4 credentials, §5 MCP server, §6 optional integrations).

Keep answers concrete and short; prefer pointing at the exact skill/command over long explanations.

## Guardrails

- Only ever write config to `recruiting-os.config.json`; never overwrite it without confirming.
- Don't fabricate credentials or paste real secrets into tracked files — secrets go only in
  `webapp/.env.local` (git-ignored).
- Respect the system-wide rules: interactive only, drafts-only email, no fabricated resume content.
