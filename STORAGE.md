# Storage backend — how skills read and write data

Recruiting OS can store all its data in one of two backends. Every skill resolves which one to use
at the **start of each run** by reading `recruiting-os.config.json` at the repo root.

```jsonc
{
  "storage": "supabase" | "local",
  "owner_name": "You",          // used in place of a hardcoded person's name
  "supabase": {
    "project_ref": "YOUR-PROJECT-REF"   // only in supabase mode; informational
  },
  "options": {
    "gmail": false,             // recruiting-digest needs the Gmail MCP
    "browser": false,           // recruiter-finder needs the claude-in-chrome MCP
    "webapp": false             // only meaningful in supabase mode
  }
}
```

**If `recruiting-os.config.json` does not exist, stop and tell the user to run the `/setup` skill
first.** Do not guess a backend.

Both backends hold the same nine logical entities. The Supabase table names and the local file
layout below are two encodings of the identical schema — a skill's behavior (what it collects, what
it validates, what it shows before writing) is the same either way; only the read/write mechanism
differs.

---

## Supabase mode (`"storage": "supabase"`)

All data lives in the `recruiting_`-prefixed tables in the user's own Supabase project. All reads
and writes go through the **Supabase MCP** (`execute_sql`), or the `recruiting-skills` MCP server's
`db_select` / `db_insert` / `db_update` tools. Never touch non-`recruiting_` tables (a Supabase
project may be shared with other apps).

Tables: `recruiting_profile_projects`, `recruiting_profile_experience`, `recruiting_profile_skills`,
`recruiting_roles`, `recruiting_applications`, `recruiting_contacts`, `recruiting_interactions`,
`recruiting_tracked_companies`, `recruiting_seen_postings`. The authoritative column list is
`supabase/migrations/` (and the bundled `supabase/schema.sql`).

---

## Local mode (`"storage": "local"`)

No database and no external account. All data lives in markdown files under `data/` (git-ignored —
it's the user's personal recruiting data). Read/write these with the ordinary Read / Write / Edit /
Glob tools. Each record is one markdown file: **YAML front matter** for structured fields, the
markdown **body** for long-form prose. Use a slug derived from the natural key (lowercase,
hyphenated) as the filename.

```
data/
  profile/
    projects/<title-slug>.md
    experience/<org>-<role-slug>.md
    skills.md                     # single file: a table of all skills
  crm/
    roles/<company>-<title-slug>.md
    contacts/<name-slug>.md
    interactions/<date>-<slug>.md
  watchlist/
    tracked-companies.md          # single file: a table
    seen-postings.md              # single file: a table (dedup cache)
```

Conventions: dates as `YYYY-MM-DD`; array fields (`tech_stack`, `tags`) as YAML lists; a null/unset
field is omitted. When "upserting", match on the natural key (below) — edit the existing file if the
slug matches, otherwise create a new one. **Never delete** a role/contact file — status changes only
(mirrors the CRM rule).

### profile/projects/`<title-slug>.md` — match on `title`
```markdown
---
title: Willett Fund Ops Platform
tech_stack: [Python, FastAPI, Postgres]
tags: [finance, backend]
repo_url: https://github.com/you/willett
date_range: 2024–2025
---
## Summary
<one-paragraph summary>
## Problem
<written by the user>
## Approach
<written by the user>
## Impact
<written by the user — never invent metrics>
## Bullets
- short: <one resume line>
- medium: <1–2 lines>
- detailed: <2–4 sentences>
```

### profile/experience/`<org>-<role-slug>.md` — match on `role` + `org`
Same shape as a project minus `repo_url`, plus a `## Notes` section (long-form material:
elevator pitch, war stories, interview-question mapping — read by resume-tailor / cover-letter).

### profile/skills.md — one file, match rows on lower(`name`)
```markdown
| name | category | source |
|------|----------|--------|
| Python | language | extracted from resume upload |
| CS 577 | coursework | extracted from resume upload |
```
`category` ∈ language / framework / tool / coursework / cert.

### crm/roles/`<company>-<title-slug>.md` — match on `company` + `title`
Applications are embedded here (there is normally one per role). Never delete; change `status` only.
```markdown
---
company: Acme Capital
title: Software Engineer
source: manual              # manual | ai-suggested | scraped
status: applied             # interested|applied|screening|interviewing|offer|rejected|ghosted|not_interested|posting_closed
posting_url: https://...
not_yet_posted: false
date_added: 2026-07-18
date_applied: 2026-07-18
application:                # omit until an application exists
  stage: applied
  next_action: phone screen
  next_action_due: 2026-07-25
  follow_up_due_days: 14
  resume_version: 1
  tailored_resume_path: resumes/tailored/acme-v1.tex
  cover_letter_version: 0
  tailored_cover_letter_path: null
last_checked_at: 2026-07-18
---
## JD
<full job-description text>
## Fit rationale
<short paragraph, no numeric score>
```

### crm/contacts/`<name-slug>.md` — match on `email`, else `name` + `company`
```markdown
---
name: Jane Recruiter
company: Acme Capital
email: jane@acme.com
role: crm/roles/acme-capital-software-engineer.md   # optional link
last_touch_date: 2026-07-18
last_touch_direction: sent        # sent | received
follow_up_due_days: 7
linkedin_url: https://linkedin.com/in/...
title: Technical Recruiter
---
## Notes
<free text>
## Draft message
<recruiter-finder draft — never auto-sent>
```

### crm/interactions/`<date>-<slug>.md`
```markdown
---
type: email                 # email | call | coffee chat | other
date: 2026-07-18
contact: crm/contacts/jane-recruiter.md      # optional
application: crm/roles/acme-capital-software-engineer.md   # optional
gmail_thread_id: null
---
<summary of the interaction>
```
After logging an interaction, update the linked contact's `last_touch_date` / `last_touch_direction`.

### watchlist/tracked-companies.md & watchlist/seen-postings.md — one file each
```markdown
<!-- tracked-companies.md -->
| company_name | ats_platform | ats_slug | active | last_scanned_at | notes |
|--------------|--------------|----------|--------|-----------------|-------|

<!-- seen-postings.md — dedup cache; posting_url is the unique key -->
| company | title | posting_url | ats_platform | matched_role | first_seen_at | last_seen_at |
|---------|-------|-------------|--------------|--------------|---------------|--------------|
```

### Follow-up computation (local mode)
Same rules as the CRM skill, computed by reading files: an application is overdue when its role
status ∈ (applied, screening, interviewing) and the latest activity date
(`greatest(date_applied, latest linked interaction date)`) is more than `follow_up_due_days` (14)
ago; a contact is overdue when `last_touch_date` is more than `follow_up_due_days` (7) ago (or null
and the file is that old).

---

## The webapp is Supabase-only

`webapp/` reads and writes the Supabase tables directly with the secret key. It has **no local-file
mode**. In local mode there is no dashboard — the skills are the whole interface. `/setup` skips the
webapp when local storage is chosen.
