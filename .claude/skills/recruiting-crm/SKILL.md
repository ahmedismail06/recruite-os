---
name: recruiting-crm
description: Ahmed's recruiting CRM — add roles, log applications/contacts/interactions, update stages, and compute follow-up-due flags. Use when Ahmed pastes a job description, says he applied somewhere, heard back, met someone, got rejected, or asks "what follow-ups are due".
---

# recruiting-crm

CRM operations on the `recruiting_` tables in Supabase project `dlyombtgtgsavtiqohve` (shared project — never touch non-`recruiting_` tables). Use Supabase MCP `execute_sql` for all reads/writes. Interactive only — no cron, no headless, nothing automatic.

## Operations

Pick from Ahmed's request; confirm the parsed fields before writing.

### Add a role
Input: pasted JD text or a link (fetch it if a link). Insert into `recruiting_roles` with `company`, `title`, `jd_text` (full text), `source = 'manual'`, `status = 'interested'`. Check for an existing row with the same company+title first; if found, ask whether to update it instead.

### Log an application
When Ahmed says he applied: set the role's `status = 'applied'` and `date_applied = now()`, and insert a `recruiting_applications` row (`stage = 'applied'`, `follow_up_due_days = 14`). One application row per role unless he re-applies to a distinct posting.

### Update stage
Update both `recruiting_applications.stage` and the coarse `recruiting_roles.status` (interested / applied / screening / interviewing / offer / rejected / ghosted / not_interested). Record `next_action` / `next_action_due` if Ahmed states one (e.g. "phone screen Friday").

**Rejection/ghosting/not interested:** set status only. Never delete the row — rejected/ghosted/not_interested roles are kept permanently for pattern analysis. Use `not_interested` when Ahmed decides to pass on a role himself (as opposed to `rejected`, where the company said no, or `ghosted`, where they went silent) — e.g. "I'm not interested in that one" or "pass on this role."

### Log a contact
Insert into `recruiting_contacts` (`name`, `company`, `email`, optional `role_id`, `notes`), `follow_up_due_days = 7` (end-of-week convention for networking contacts). Dedupe on email, else name+company.

### Log an interaction
Insert into `recruiting_interactions` (`type`: email / call / coffee chat / other, `summary`, `date`, link `contact_id` and/or `application_id`). Then update the contact's `last_touch_date` and `last_touch_direction` ('sent' if Ahmed reached out, 'received' if they did).

### Follow-up check ("what's due?")
Compute on read — there is no background job:

- **Applications overdue:** applications where the role status is in (applied, screening, interviewing) and the last activity date — `greatest(date_applied, latest linked interaction date, updated_at)` — is more than `follow_up_due_days` (default 14) days ago.
- **Contacts overdue:** contacts where `last_touch_date` is more than `follow_up_due_days` (default 7) days ago, or is null and `created_at` is that old.

Print a table: who/what, days silent, suggested next action. Do not send or draft emails from this skill — that's `recruiting-digest`'s job.

## Guardrails

- Never delete rows from any `recruiting_` table; status changes only.
- Confirm parsed company/title/stage with Ahmed before writing when there's any ambiguity.
- Only `recruiting_`-prefixed tables.
