# Recruiting OS — Project Spec

## 0. Overview

A personal recruiting system for tracking job search activity end-to-end: a knowledge base of everything about me (Profile Bank), a CRM for roles/applications/contacts, on-demand resume/cover-letter tailoring agents, and an on-demand email watchdog. Everything runs manually — I trigger every action. Nothing runs on a schedule or timer. No `ANTHROPIC_API_KEY` is ever set; all AI work happens through interactive Claude Code sessions on subscription billing, never headless/`claude -p`/Agent SDK.

**Owner:** the user (single user, no multi-tenancy needed)
**Repo name:** `recruiting-os`

## 1. Architecture

- **Database:** Supabase — reuses the user's existing Supabase project (currently home to the recipes app), not a new project. All Recruiting OS tables are prefixed `recruiting_` to avoid naming collisions (e.g. `recruiting_profile_projects` can never clash with an unrelated `projects` table). RLS policies scoped per-table so recipe-app data and recruiting data stay isolated even though they share a project/auth instance.
- **Webapp:** Next.js, edit-enabled, deployed on Vercel
- **Auth:** none (login removed 2026-07-01). All DB access is server-side via the project secret key; the app must not be deployed to a publicly reachable URL without access protection
- **Skills:** Live in `.claude/skills/`, invoked manually by name in a Claude Code session. Supabase MCP for DB, Gmail MCP for email. No cron, no GitHub Actions, no headless runs.
- **Resume format:** LaTeX. `resume-tailor` only edits bullet points and adds/removes project blocks — never structure, formatting, margins, or document class.

## 2. Data Model (Supabase)

Nine `recruiting_`-prefixed tables — see `supabase/migrations/` for the authoritative schema:

- `recruiting_profile_projects` — title, summary, problem/approach/impact (written by the user), tech_stack[], tags[], repo_url, bullet_short/medium/detailed, date_range
- `recruiting_profile_experience` — role, org, date_range, problem/approach/impact, tech_stack, tags, bullet variants
- `recruiting_profile_skills` — name, category (language/framework/tool/coursework/cert), source. Coursework and certs (CS 577, STAT 340, Posse, Business Certificate) extracted from an uploaded resume, not manually entered.
- `recruiting_roles` — company, title, jd_text, source (manual/ai-suggested), status (interested/applied/screening/interviewing/offer/rejected/ghosted), fit_rationale (short paragraph, no numeric score), date_added, date_applied
- `recruiting_applications` — role_id, stage, next_action(+due), tailored_resume_path, resume_version (incremented per resume-tailor run, full history), tailored_cover_letter_path, cover_letter_version (added 2026-07-04, mirrors resume versioning), follow_up_due_days (default 14)
- `recruiting_contacts` — name, company, role_id?, email, last_touch_date, last_touch_direction (sent/received), follow_up_due_days (default 7 = end of week), notes
- `recruiting_interactions` — contact_id?, application_id?, type (email/call/coffee chat/other), summary, date, gmail_thread_id
- `recruiting_tracked_companies` (added 2026-07-11) — company_name, ats_platform (greenhouse/lever/ashby), ats_slug, active, notes, added_date, last_scanned_at. Watchlist for `ats-scan`.
- `recruiting_seen_postings` (added 2026-07-11) — company, title, posting_url (unique), ats_platform, jd_text, matched_role_id?, first_seen_at, last_seen_at. Dedup cache so `ats-scan` only surfaces genuinely new postings on repeat runs, independent of what actually made it into `recruiting_roles`.

**Rejected/ghosted roles are never deleted** — kept for pattern analysis.

## 3. Skills

- **profile-bank** — reads the user's actual repos to extract factual details; the user supplies problem/approach/impact; writes the three profile tables. First run also ingests an uploaded resume for coursework/certs/skills.
- **recruiting-crm** — add role (pasted JD/link), log application/contact/interaction, stage updates. Follow-up flags: 14 days silence on an application → due; 7 days silence from a networking contact → due. Rejection: status → rejected, never hidden.
- **role-recommend** — on-demand only. Takes a pasted role or scans interested manual roles; compares against Profile Bank; returns a short written fit rationale (no score): matches, stretches, gaps.
- **role-scout** (added 2026-07-01) — on-demand discovery from a described thesis (e.g. "tech for asset managers/allocators"): web-searches companies/open roles in the space, filters against the Profile Bank, presents a shortlist with fit notes; inserts confirmed picks as `source = 'ai-suggested'`, `status = 'interested'`. No-thesis mode (added 2026-07-03): derives 2–4 candidate theses from the Profile Bank with grounded reasoning; the user picks/edits one before sourcing proceeds. Flags ATS-hosted confirmed picks (added 2026-07-11) as candidates for the `ats-scan` watchlist.
- **ats-scan** (added 2026-07-11) — on-demand, structured complement to role-scout's web search. Maintains a company watchlist (`recruiting_tracked_companies`: company + ATS platform + board slug) and polls each company's public Greenhouse/Lever/Ashby job-board API via `scripts/ats-scan.mjs` (fetch-only — no DB access, all reads/writes happen in the skill via Supabase MCP). Dedupes every posting seen against `recruiting_seen_postings` so re-scans only surface what's genuinely new, filters against the Profile Bank, and proposes new roles the same way role-scout does — the user confirms before anything is added to `recruiting_roles` (`source = 'scraped'`).
- **resume-tailor** — input: JD + application. Reads base .tex, pulls Profile Bank bullet variants, rewrites within existing bullet slots to mirror JD language, adds/removes project blocks. Budget (added 2026-07-03): ~18 bullets total, reached by cutting the least JD-relevant project blocks whole — employment entries always stay, and no thin 2–3 bullet project blocks. Guardrails: never fabricate; keep to one page unless base is longer. Before writing the file (added 2026-07-11), the draft goes through the `application-reviewer` subagent for an independent critique; blocking issues (fabrication, structural drift) must be fixed. Saves as a new version linked to the application; never overwrites.
- **cover-letter** (added 2026-07-04) — input: JD + application. Reads `cover-letters/base.tex` (letter shell mirroring the resume header), picks the 1–2 strongest Profile Bank matches for the JD's top requirements, drafts a 3–4 paragraph / ~250–350 word letter reworded from real `problem`/`approach`/`impact` material — never fabricated. Same `application-reviewer` critique pass as resume-tailor (added 2026-07-11) before finalizing. Versioned like resumes (`tailored_cover_letter_path`, `cover_letter_version`); never overwrites. Produces a file only — sending is the user's action.
- **recruiter-finder** (added 2026-07-05) — input: a company (usually tied to a tracked role). Finds named recruiting/TA contacts via LinkedIn search (claude-in-chrome, the user's own logged-in session), ranks by connection degree and role fit, drafts a short connection-note message per contact the user confirms from real Profile Bank material — never sends or connects automatically. Writes to `recruiting_contacts` (`linkedin_url`, `title`, `draft_message`).
- **recruiting-digest** — on-demand. Scans Gmail (Gmail MCP) for threads matching CRM contacts/companies; flags recruiting-looking mail from unknown senders and proposes adding (the user confirms). Classifies threads: needs-my-reply / awaiting-their-reply / follow-up-due. Drafts follow-ups as Gmail drafts (never sends). Prints summary.

## 3a. Application review loop

`resume-tailor` and `cover-letter` each draft, then hand the draft to the `application-reviewer`
subagent (`.claude/agents/application-reviewer.md`, invoked via the Agent tool) for an independent
critique against the JD and the Profile Bank rows the draft claims to draw from — fabrication,
structural drift, JD alignment, redundancy, length. Fabrication and structural-drift findings are
blocking; the drafting skill must fix them. Other findings are the drafting skill's judgment call,
surfaced to the user either way. This is two passes within one interactive session the user triggers, not
a background/autonomous loop — consistent with the no-cron/no-headless rule.

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
5. `resume-tailor` skill (needs the user's `.tex` file → `resumes/base.tex`)
6. `recruiting-digest` skill (Gmail MCP)
7. Webapp

## 7. Open items

- LaTeX base resume file — to be provided before first `resume-tailor` run (save as `resumes/base.tex`)
- Networking follow-up window assumed 7 days (end of week)
