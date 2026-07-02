---
name: role-scout
description: Discover companies and open roles matching a thesis Ahmed describes (e.g. "tech for asset managers/allocators", "fintech infra", "quant platform teams"), cross-check against his Profile Bank, and propose additions to the CRM. Use when Ahmed describes a kind of company/role he wants to find rather than pasting a specific JD.
---

# role-scout

On-demand role discovery from a described thesis. Uses web search for sourcing and Supabase MCP (`execute_sql`, project `dlyombtgtgsavtiqohve`) for the Profile Bank and CRM. Never runs automatically.

## Input

A description of what Ahmed is looking for — a space ("tech for asset managers/allocators"), a role shape ("backend-heavy SWE new grad"), a geography, or any combination. Ask one round of clarifying questions only if the thesis is too vague to search (e.g. no role type at all).

## Procedure

1. **Load context.** Pull the Profile Bank (projects, experience, skills) and existing `recruiting_roles` (company+title, to avoid proposing duplicates).
2. **Source candidates.** Web-search the thesis: companies in the space (e.g. for asset-manager/allocator tech: portfolio management platforms, alternatives/LP tooling, fund admin, market data, OMS/EMS vendors, and the technology arms of the managers themselves), then their careers pages for currently open roles matching Ahmed's level. **Always include startups alongside established companies** — search seed-to-Series-C companies in the space too (recent funding announcements, YC/accelerator directories, startup job boards like Work at a Startup and Wellfound), and aim for a mix of both in every shortlist. Startups often don't post formal JDs; a careers page or funding news naming the team's stack is enough to propose one, flagged as "no formal posting — worth a cold outreach". Prefer verifiable, currently-open postings; note the posting URL and date seen.
3. **Filter against the bank.** Drop roles whose hard requirements clearly don't match anything in the Profile Bank (e.g. requires 8+ years, or a credential he lacks). Borderline is fine — flag it, don't drop it.
4. **Present a shortlist** (aim for 5–10): company, role title, link, one line on what the company does, and a 2–3 sentence fit note grounded in actual bank rows (same rules as role-recommend: matches, stretches, gaps — no scores, no invented experience).
5. **Add only what Ahmed confirms.** For each role he approves, insert into `recruiting_roles` with `source = 'ai-suggested'`, `status = 'interested'`, `jd_text` (fetch the posting text if accessible), and the fit note as `fit_rationale`. Never insert unconfirmed suggestions.

## Guardrails

- Propose, never auto-add — every CRM write requires Ahmed's explicit yes.
- Only claim a posting is open if a live page shows it; include the URL so Ahmed can verify.
- Fit notes grounded in real Profile Bank rows only.
- Only `recruiting_`-prefixed tables.
