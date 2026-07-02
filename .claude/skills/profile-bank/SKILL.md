---
name: profile-bank
description: Build or update Ahmed's Profile Bank — extract factual project/experience details from his real repos and resume, collect his problem/approach/impact narrative, and write bullet variants to the recruiting_profile_* Supabase tables. Use when Ahmed says "update my profile bank", "add <project> to my profile", or "ingest my resume".
---

# profile-bank

Populates and maintains the Profile Bank: `recruiting_profile_projects`, `recruiting_profile_experience`, `recruiting_profile_skills` in Supabase project `dlyombtgtgsavtiqohve` (shared with the recipes app — never touch non-`recruiting_` tables).

All DB access goes through the Supabase MCP tools (`execute_sql`). Never suggest cron, headless runs, or `ANTHROPIC_API_KEY` — this skill only runs inside an interactive session when Ahmed invokes it.

## Modes

Decide from Ahmed's request:

1. **Add/update a project** — Ahmed names a project and (usually) a repo path or URL.
2. **Add/update an experience** — a job/role (e.g. Willett, IvyRead, swim coaching); usually no repo.
3. **Ingest resume** (first run, or when he uploads a new resume) — extract skills, coursework, certs.

## Adding a project

1. **Read the actual code.** If a local repo path is given, explore it (structure, main modules, dependencies/manifests, README). Extract only *facts*: tech stack, architecture, what was actually built. Never infer impact numbers from code.
2. **Ask Ahmed for the narrative.** `problem`, `approach`, `impact` are written by him. If he hasn't supplied them in the invocation, ask for all three in one message before writing anything. Do not draft them for him unless he explicitly asks; even then, base every claim on what he said or what the code shows.
3. **Draft bullet variants** from his narrative + extracted facts:
   - `bullet_short` — one resume line (~1 line at 10.5–11pt), strong verb, tech + outcome.
   - `bullet_medium` — 1–2 lines with more specifics.
   - `bullet_detailed` — 2–4 sentences, interview-prep depth.
   Show all three to Ahmed for approval before writing to the DB. Never include a metric he didn't state.
4. **Upsert** into `recruiting_profile_projects` (match on `title`; update if it exists, insert otherwise). Fill `tech_stack` from the repo analysis, `tags` (e.g. finance, ML, backend, full-stack, leadership), `repo_url`, `date_range`, `summary`.
5. Also upsert any newly-seen technologies into `recruiting_profile_skills` with `source = 'extracted from <repo>'` (category: language/framework/tool). Skip duplicates (match on lower(name)).

## Adding an experience

Same flow minus repo analysis: collect `role`, `org`, `date_range`, his problem/approach/impact, draft the three bullet variants, get approval, upsert into `recruiting_profile_experience` (match on role+org).

## Resume ingestion

1. Ask for the resume file (PDF or .tex) if not provided; read it.
2. Extract into `recruiting_profile_skills` with `source = 'extracted from resume upload'`:
   - languages/frameworks/tools from the skills section
   - coursework (e.g. CS 577, STAT 340) → `category = 'coursework'`
   - certificates/programs (e.g. Posse, Business Certificate) → `category = 'cert'`
3. Show the extracted list for confirmation, then insert (skip rows whose lower(name) already exists).
4. If the resume mentions projects/experience not yet in the bank, list them and offer to add each via the flows above — don't auto-add.

## Guardrails

- Facts come from code and Ahmed; narrative comes from Ahmed only. Never fabricate metrics, scope, or claims.
- Only write to `recruiting_`-prefixed tables.
- Always show what you're about to write and get a yes before the DB write.
