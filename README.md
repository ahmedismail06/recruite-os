# recruiting-os

Personal recruiting system: Profile Bank + CRM + resume tailoring + email watchdog. Single user (Ahmed), everything manually triggered from interactive Claude Code sessions — nothing scheduled, nothing headless.

- **Spec:** `SPEC.md` · **Session rules:** `CLAUDE.md`
- **Database:** Supabase (shared project `mamas-recipes`, all tables prefixed `recruiting_`) — `supabase/migrations/`
- **Skills:** `.claude/skills/` — `/profile-bank`, `/recruiting-crm`, `/role-recommend`, `/resume-tailor`, `/recruiting-digest`
- **Webapp:** `webapp/` — Next.js pipeline board, contacts, role detail, profile viewer (Vercel)
- **Resumes:** `resumes/base.tex` (base template, provided by Ahmed) and `resumes/tailored/` (versioned outputs)
