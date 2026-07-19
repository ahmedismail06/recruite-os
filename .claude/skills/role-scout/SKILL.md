---
name: role-scout
description: Discover companies and open roles matching a thesis the user describes (e.g. "tech for asset managers/allocators", "fintech infra", "quant platform teams"), cross-check against the user's Profile Bank, and propose additions to the CRM. Use when the user describes a kind of company/role the user wants to find rather than pasting a specific JD.
---

# role-scout

On-demand role discovery from a described thesis. Uses web search for sourcing; reads/writes the Profile Bank and CRM through the backend named in `recruiting-os.config.json` per `STORAGE.md` (Supabase MCP `execute_sql` on the `recruiting_` tables, or the markdown under `data/`). If no config exists, tell the user to run `/setup` first. Never runs automatically.

## Input

A description of what the user is looking for — a space ("tech for asset managers/allocators"), a role shape ("backend-heavy SWE new grad"), a geography, or any combination. Ask one round of clarifying questions only if the thesis is too vague to search (e.g. no role type at all).

**No thesis given → derive one.** If the user invokes the skill without a thesis (or asks "what roles should I even look for"), load the Profile Bank first and propose 2–4 candidate theses derived from it — each a one-line search thesis plus 1–2 sentences of reasoning grounded in actual bank rows (which projects/skills make this a strong lane). Present them, let the user pick or edit one (multiple is fine), and only then continue to sourcing. Derived theses follow the same honesty rules as fit notes: grounded in real bank content, gaps acknowledged, no flattery.

## Procedure

1. **Load context.** Pull the Profile Bank (projects, experience, skills) and existing `recruiting_roles` (company+title, to avoid proposing duplicates).
2. **Check the watchlist first.** Query `recruiting_roles where not_yet_posted = true`. For each, quickly check whether a live posting now exists (search / fetch the company's careers page or program page). If it's now live: update `posting_url` and `jd_text` with the real posting, set `not_yet_posted = false`, and call it out prominently at the top of the run as "now open." If still not posted: just update `last_checked_at = now()` and leave it as-is — no need to ask the user anything for a no-change check. Mention the still-watching roles briefly in the summary (company + what you're waiting for). Do this before sourcing new candidates so results don't duplicate what's already tracked.
3. **Source candidates.** Web-search the thesis: companies in the space (e.g. for asset-manager/allocator tech: portfolio management platforms, alternatives/LP tooling, fund admin, market data, OMS/EMS vendors, and the technology arms of the managers themselves), then their careers pages for currently open roles matching the user's level. **Always include startups alongside established companies** — search seed-to-Series-C companies in the space too (recent funding announcements, YC/accelerator directories, startup job boards like Work at a Startup and Wellfound), and aim for a mix of both in every shortlist. Startups often don't post formal JDs; a careers page or funding news naming the team's stack is enough to propose one, flagged as "no formal posting — worth a cold outreach". Prefer verifiable, currently-open postings; note the posting URL and date seen.
4. **Filter against the bank.** Drop roles whose hard requirements clearly don't match anything in the Profile Bank (e.g. requires 8+ years, or a credential the user lacks). Borderline is fine — flag it, don't drop it.
5. **Present a shortlist** (aim for 5–10): company, role title, link, one line on what the company does, and a 2–3 sentence fit note grounded in actual bank rows (same rules as role-recommend: matches, stretches, gaps — no scores, no invented experience).
6. **Add only what the user confirms.** For each role the user approves, insert into `recruiting_roles` with `source = 'ai-suggested'`, `status = 'interested'`, `jd_text` (fetch the posting text if accessible), and the fit note as `fit_rationale`. If the role is a recurring program/company that hasn't posted a live JD yet, set `not_yet_posted = true` and leave `jd_text` null instead of fabricating one — step 2 will recheck it on future runs. Never insert unconfirmed suggestions.
7. **Flag ATS-hosted companies for tracking.** If a confirmed posting's URL matches `boards.greenhouse.io/<slug>`, `jobs.lever.co/<slug>`, or `jobs.ashbyhq.com/<slug>`, mention that the company could be added to the `ats-scan` watchlist for automatic recheck on future scans, and offer to add it if the user wants.

## Guardrails

- Propose, never auto-add — every CRM write requires the user's explicit yes.
- Only claim a posting is open if a live page shows it; include the URL so the user can verify.
- Fit notes grounded in real Profile Bank rows only.
- Only `recruiting_`-prefixed tables.
- `not_yet_posted = true` is for recurring corporate programs expected to post later (e.g. "applications open in fall") — not for startups with no formal hiring process, which stay `not_yet_posted = false` and get flagged as cold-outreach in the fit note instead (they may never post a JD, so there's nothing to "recheck").
