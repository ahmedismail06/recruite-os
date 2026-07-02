# Recruiting OS — Project Spec

## 0. Overview

A personal recruiting system for tracking job search activity end-to-end: a knowledge base of everything about me (Profile Bank), a CRM for roles/applications/contacts, an on-demand resume tailoring agent, and an on-demand email watchdog. Everything runs manually — I trigger every action. Nothing runs on a schedule or timer. No `ANTHROPIC_API_KEY` is ever set; all AI work happens through interactive Claude Code sessions on subscription billing, never headless/`claude -p`/Agent SDK.

**Owner:** Ahmed (single user, no multi-tenancy needed)
**Repo name:** `recruiting-os`

## 1. Architecture

- **Database:** Supabase — reuses Ahmed's existing Supabase project (currently home to the recipes app), not a new project. All Recruiting OS tables are prefixed `recruiting_` to avoid naming collisions (e.g. `recruiting_profile_projects` can never clash with an unrelated `projects` table). RLS policies scoped per-table so recipe-app data and recruiting data stay isolated even though they share a project/auth instance.
- **Webapp:** Next.js, edit-enabled, deployed on Vercel
- **Auth:** none (login removed 2026-07-01). All DB access is server-side via the project secret key; the app must not be deployed to a publicly reachable URL without access protection
- **Skills:** Live in `.claude/skills/`, invoked manually by name in a Claude Code session. Supabase MCP for DB, Gmail MCP for email. No cron, no GitHub Actions, no headless runs.
- **Resume format:** LaTeX. `resume-tailor` only edits bullet points and adds/removes project blocks — never structure, formatting, margins, or document class.

## 2. Data Model (Supabase)

Seven `recruiting_`-prefixed tables — see `supabase/migrations/` for the authoritative schema:

- `recruiting_profile_projects` — title, summary, problem/approach/impact (written by Ahmed), tech_stack[], tags[], repo_url, bullet_short/medium/detailed, date_range
- `recruiting_profile_experience` — role, org, date_range, problem/approach/impact, tech_stack, tags, bullet variants
- `recruiting_profile_skills` — name, category (language/framework/tool/coursework/cert), source. Coursework and certs (CS 577, STAT 340, Posse, Business Certificate) extracted from an uploaded resume, not manually entered.
- `recruiting_roles` — company, title, jd_text, source (manual/ai-suggested), status (interested/applied/screening/interviewing/offer/rejected/ghosted), fit_rationale (short paragraph, no numeric score), date_added, date_applied
- `recruiting_applications` — role_id, stage, next_action(+due), tailored_resume_path, resume_version (incremented per resume-tailor run, full history), follow_up_due_days (default 14)
- `recruiting_contacts` — name, company, role_id?, email, last_touch_date, last_touch_direction (sent/received), follow_up_due_days (default 7 = end of week), notes
- `recruiting_interactions` — contact_id?, application_id?, type (email/call/coffee chat/other), summary, date, gmail_thread_id

**Rejected/ghosted roles are never deleted** — kept for pattern analysis.

## 3. Skills

- **profile-bank** — reads Ahmed's actual repos to extract factual details; Ahmed supplies problem/approach/impact; writes the three profile tables. First run also ingests an uploaded resume for coursework/certs/skills.
- **recruiting-crm** — add role (pasted JD/link), log application/contact/interaction, stage updates. Follow-up flags: 14 days silence on an application → due; 7 days silence from a networking contact → due. Rejection: status → rejected, never hidden.
- **role-recommend** — on-demand only. Takes a pasted role or scans interested manual roles; compares against Profile Bank; returns a short written fit rationale (no score): matches, stretches, gaps.
- **resume-tailor** — input: JD + application. Reads base .tex, pulls Profile Bank bullet variants, rewrites within existing bullet slots to mirror JD language, adds/removes project blocks. Guardrails: never fabricate; keep to one page unless base is longer. Saves as a new version linked to the application; never overwrites. Cover letters out of scope for v1.
- **recruiting-digest** — on-demand. Scans Gmail (Gmail MCP) for threads matching CRM contacts/companies; flags recruiting-looking mail from unknown senders and proposes adding (Ahmed confirms). Classifies threads: needs-my-reply / awaiting-their-reply / follow-up-due. Drafts follow-ups as Gmail drafts (never sends). Prints summary.

## 4. Webapp

Edit-enabled — add/update roles, stages, contacts, interactions in the UI, writing to the same tables the skills use. Views: pipeline board (roles by stage), contacts list with follow-up-due flags, role detail (JD, fit rationale, applications/resume versions), profile bank viewer (read-mostly). Auth: none — server-side secret key; keep deployments access-protected. Hosting: Vercel.

## 5. Non-goals / guardrails

- No autonomous/scheduled runs — no cron, no GitHub Actions, no headless `claude -p`, no `ANTHROPIC_API_KEY`
- No auto-sent emails — drafts only
- No fabricated resume content — real Profile Bank material only
- Resume structure/formatting never touched
- Rejected/ghosted roles retained

## 6. Build phases

1. Supabase schema ✅ (applied 2026-07-01)
2. `profile-bank` skill + initial population
3. `recruiting-crm` skill
4. `role-recommend` skill
5. `resume-tailor` skill (needs Ahmed's `.tex` file → `resumes/base.tex`)
6. `recruiting-digest` skill (Gmail MCP)
7. Webapp

## 7. Open items

- LaTeX base resume file — to be provided before first `resume-tailor` run (save as `resumes/base.tex`)
- Networking follow-up window assumed 7 days (end of week)
