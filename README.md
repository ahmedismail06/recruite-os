# recruiting-os

Personal recruiting system: Profile Bank + CRM + resume tailoring + email watchdog. Single user (Ahmed), everything manually triggered from interactive Claude Code sessions — nothing scheduled, nothing headless.

- **Spec:** `SPEC.md` · **Session rules:** `CLAUDE.md`
- **Database:** Supabase (shared project `mamas-recipes`, all tables prefixed `recruiting_`) — `supabase/migrations/`
- **Skills:** `.claude/skills/` — `/profile-bank`, `/recruiting-crm`, `/role-recommend`, `/role-scout`, `/ats-scan`, `/ats-audit`, `/resume-tailor`, `/cover-letter`, `/recruiter-finder`, `/cold-outreach`, `/recruiting-digest`, `/interview-prep`
- **Reviewer agent:** `.claude/agents/application-reviewer.md` — read-only second pass on every resume and cover-letter draft (fabrication, structural drift, JD alignment, redundancy, length)
- **MCP server:** `mcp/skills-server/` — exposes the skills as prompts plus select/insert/update tools scoped to the `recruiting_` tables (no delete tool)
- **Scripts:** `scripts/ats-scan.mjs` (job-board polling), `scripts/outlook-draft.mjs` (opens a pre-filled Outlook draft; never sends)
- **Webapp:** `webapp/` — Next.js pipeline board, contacts, role detail, profile viewer (Vercel)
- **Resumes:** `resumes/base.tex` (base template, provided by Ahmed) and `resumes/tailored/` (versioned outputs)
