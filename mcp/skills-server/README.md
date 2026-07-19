# recruiting-skills-mcp

Stdio MCP server that makes the recruiting-os runnable from any Claude Code
session. It exposes:

- **Prompts** — one per skill in `.claude/skills/`, so each shows up as a slash
  command: `/mcp__recruiting-skills__recruiting-crm`,
  `/mcp__recruiting-skills__resume-tailor`, etc. Each takes an optional `args`
  string (your request for that invocation).
- **Skill tools** — `list_skills` (name + description of every skill) and
  `get_skill` (full instructions for one skill), so Claude can discover and
  load a skill on its own.
- **DB tools** — `db_select`, `db_insert`, `db_update` against the recruiting
  tables, using the same `SUPABASE_URL` / `SUPABASE_SECRET_KEY` credentials as
  the webapp (read from `webapp/.env.local`, overridable via the server's
  environment). These apply only to the **Supabase** storage backend; in local
  (`.md` files) mode the skills read and write files under `data/` directly, so
  the DB tools are simply unused. See `STORAGE.md`.

Skill content is re-read from disk on every invocation, so editing a SKILL.md
takes effect immediately. Adding or removing a skill *directory* requires a
server restart (prompts are registered at startup).

## Setup

The easiest path is `node scripts/setup.mjs` from the repo root (or `npm run setup`) — it installs
this server's deps and prints the exact `claude mcp add` command with your clone's absolute path
already filled in. To do it by hand:

```sh
cd mcp/skills-server && npm install
```

Register at **user scope** so it's available in every Claude Code session. Use the absolute path to
`server.mjs` in *your* clone (`node -e "console.log(process.cwd())"` from the repo root, or run
`scripts/setup.mjs` which prints it):

```sh
claude mcp add --scope user recruiting-skills -- node <ABSOLUTE-PATH-TO-CLONE>/mcp/skills-server/server.mjs
```

To point the server at a different skills directory, set `RECRUITING_SKILLS_DIR`.

## Guardrails

- **Table allowlist.** The DB tools reach only the nine `recruiting_` tables
  (enforced by input schema); recipe-app objects in the shared project are
  unreachable.
- **No delete tool.** CRM rows are never deleted — roles are marked
  rejected/ghosted via status instead.
- **No table-wide updates.** `db_update` requires at least one filter.
- The secret key bypasses RLS — it stays in `webapp/.env.local` / server env
  and is never sent to a client.
- The server performs no AI work and sends no email; skill guardrails
  (interactive only, drafts only, no fabrication) ride along in the prompt
  preamble each skill is served with.
