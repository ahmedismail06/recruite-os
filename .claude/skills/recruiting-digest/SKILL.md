---
name: recruiting-digest
description: On-demand email watchdog — scan Gmail for recruiting threads, match them to CRM contacts/companies, classify reply status, draft (never send) overdue follow-ups, and print a status summary. Use when Ahmed asks for a recruiting status check, digest, or "what needs a reply".
---

# recruiting-digest

On-demand only — runs when Ahmed asks, never on a schedule. Uses Gmail MCP for mail and Supabase MCP (`execute_sql`, project `dlyombtgtgsavtiqohve`) for CRM data.

## Procedure

### 1. Load CRM state
Fetch all `recruiting_contacts` (name, email, company, last_touch, follow_up_due_days), active `recruiting_roles`/`recruiting_applications` (status not in rejected/ghosted/not_interested for outreach purposes), and recent `recruiting_interactions` (with `gmail_thread_id`).

### 2. Scan Gmail
Use Gmail search (`search_threads`) scoped to roughly the last 30 days:
- one pass per known contact email (`from:` / `to:`),
- one pass per active company name,
- one broad pass for recruiting-looking mail (terms like: interview, application, recruiter, phone screen, offer, "thank you for applying", OA / online assessment).

### 3. Match and classify
For each matched thread, classify as exactly one of:
- **needs-my-reply** — last message is from them and unanswered.
- **awaiting-their-reply** — last message is from Ahmed.
- **follow-up-due** — awaiting-their-reply AND silence has exceeded the threshold: 14 days for application threads, the contact's `follow_up_due_days` (default 7) for networking threads.

Threads from senders **not** in the CRM that look recruiting-related: list them separately and *propose* adding sender as a contact (and company as a role if apparent). Only write to the CRM after Ahmed confirms, then log an interaction with the `gmail_thread_id`.

### 4. Update interactions
For known contacts with new inbound mail, update `last_touch_date` / `last_touch_direction = 'received'` and insert a `recruiting_interactions` row (type email, short summary, `gmail_thread_id`) — skip threads whose `gmail_thread_id` is already logged with the same last-message date.

### 5. Draft follow-ups (never send)
For every **follow-up-due** item, create a Gmail **draft** (`create_draft`) — reply on the existing thread where possible:
- Application follow-up: brief, reiterates interest, references the date applied and role title.
- Networking follow-up: references the last interaction's summary from the CRM.
Plain, specific, no invented details. **Never send email under any circumstances** — Ahmed reviews and sends drafts himself.

### 6. Summary
End with a chat summary: overdue applications (days silent), overdue contacts, threads needing Ahmed's reply, drafts created (with subjects), and proposed new CRM entries awaiting his confirmation.

## Guardrails

- Drafts only — no send, ever.
- New contacts/roles from email require explicit confirmation before DB writes.
- Only `recruiting_`-prefixed tables; never delete rows.
