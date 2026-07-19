---
name: role-recommend
description: Assess how well a role fits the user's Profile Bank and write a short fit rationale (no numeric score). Use when the user pastes a JD and asks "is this a fit", or asks to review the user's interested roles.
---

# role-recommend

On-demand fit assessment against the Profile Bank. **Storage is backend-agnostic** — read it from the backend named in `recruiting-os.config.json` per `STORAGE.md` (Supabase MCP `execute_sql` on the `recruiting_` tables, or the markdown under `data/`); if no config exists, tell the user to run `/setup` first. Never runs automatically.

## Input

Either:
- a JD the user pastes/links in the invocation, or
- no input → scan `recruiting_roles` where `source = 'manual'` and `status = 'interested'` and assess each (skip ones that already have a `fit_rationale` unless asked to redo).

## Procedure

1. Load the Profile Bank: all rows from `recruiting_profile_projects`, `recruiting_profile_experience`, `recruiting_profile_skills`.
2. For each role, compare the JD requirements against the bank and write a **short written paragraph** (3–6 sentences, no numeric score) covering:
   - **What matches** — concrete projects/experience/skills that map to named requirements.
   - **What's a stretch** — adjacent-but-not-exact experience, and which bank item is closest.
   - **What's missing** — hard requirements with nothing in the bank.
3. Ground every claim in an actual bank row — never invent experience. If the bank is thin in an area the JD emphasizes, say so plainly.
4. Print the rationale in chat. If the role exists in `recruiting_roles`, save it to `fit_rationale` (confirm before overwriting an existing rationale). If the user pasted a brand-new JD, offer to add it as a role (via the recruiting-crm flow) with the rationale attached — don't add it unasked.

## Guardrails

- No scores, rankings, or percentages — prose only.
- Honest about gaps; the point is deciding where to spend effort, not flattery.
- Read/write only `recruiting_`-prefixed tables.
