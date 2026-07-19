# recruiting-os

A personal recruiting system you run from Claude Code: a **Profile Bank** of everything about you, a
**CRM** for roles / applications / contacts, on-demand **resume & cover-letter tailoring**, role
discovery, and an email **watchdog** — all driven by skills you trigger in interactive sessions.
Nothing is scheduled, nothing is headless, no email is ever auto-sent.

## Quickstart (clone and go)

```sh
git clone <this-repo> recruiting-os && cd recruiting-os
npm run setup          # installs deps, scaffolds config, prints the next command
```

Then, following what `setup` prints:

```sh
# register the skills so /setup and the others work in every Claude Code session
claude mcp add --scope user recruiting-skills -- node "$(pwd)/mcp/skills-server/server.mjs"
```

Now open Claude Code in this folder and run **`/setup`** — it walks you through the rest
interactively (storage choice, credentials, optional integrations, first run). That's the only thing
you need to remember: **run `/setup`**.

## Choose how your data is stored

`/setup` asks you to pick a backend — either works, and you can switch later by re-running it:

- **Local `.md` files** — zero external accounts. All data lives in markdown under `data/`
  (git-ignored). Every skill works. No webapp. Great for trying it out or keeping everything on your
  machine.
- **Supabase** — a free Supabase project backs the data and additionally unlocks the Next.js
  **webapp** (pipeline board, contacts, profile viewer). `/setup` bundles the schema into
  `supabase/schema.sql` for a one-paste apply.

The two backends share one schema — see [`STORAGE.md`](STORAGE.md).

## Skills

Run any of these in Claude Code (as `/<name>`, or `/mcp__recruiting-skills__<name>`):

- **`/setup`** — first-run configuration (start here).
- **`/profile-bank`** — build/update your Profile Bank; ingest your resume.
- **`/recruiting-crm`** — add roles, log applications/contacts/interactions, follow-up flags.
- **`/role-recommend`** — assess how a role fits your Profile Bank.
- **`/role-scout`** — discover companies/roles from a described thesis.
- **`/ats-scan`** — scan Greenhouse/Lever/Ashby boards for your tracked companies.
- **`/resume-tailor`** — tailor your LaTeX resume to a JD (bullets & project inclusion only).
- **`/cover-letter`** — draft a JD-tailored cover letter from real Profile Bank material.
- **`/recruiter-finder`** — find recruiters on LinkedIn (your own session) and draft outreach.
- **`/recruiting-digest`** — scan Gmail for recruiting threads and draft (never send) follow-ups.

Some skills need an optional MCP configured in your Claude Code — Gmail for `recruiting-digest`,
`claude-in-chrome` for `recruiter-finder`, and (Supabase mode) the Supabase MCP for DB access.
`/setup` tells you which and lets you enable them.

## Ground rules (built into every skill)

- Everything is manual and interactive — no cron, no headless runs, no `ANTHROPIC_API_KEY`.
- No auto-sent email — drafts only.
- No fabricated resume/profile content — only real Profile Bank material.
- CRM rows are never deleted — rejected/ghosted roles are kept for pattern analysis.

## Layout

- `.claude/skills/` — the skills. **Design spec:** [`SPEC.md`](SPEC.md) · **session rules:** [`CLAUDE.md`](CLAUDE.md).
- `STORAGE.md` — the storage schema for both backends.
- `webapp/` — Next.js dashboard (Supabase mode only).
- `mcp/skills-server/` — MCP server exposing the skills as slash commands.
- `scripts/` — `setup.mjs` (onboarding helper) and `ats-scan.mjs` (job-board fetcher).
- `supabase/migrations/` — the schema history (Supabase mode).
- `resumes/`, `cover-letters/`, `knowledge-base/`, `data/` — your personal content (all git-ignored).
