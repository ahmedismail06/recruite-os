---
name: ats-scan
description: Scan Greenhouse/Lever/Ashby job boards for Ahmed's tracked companies for new postings, dedupe against previously seen ones, and propose additions to the CRM. Use when Ahmed asks to check/scan tracked companies for new openings, or to add a company to the ATS watchlist.
---

# ats-scan

On-demand structured job-board scan, complementary to `role-scout`'s thesis-based web search:
instead of searching broadly, this hits the public JSON APIs of Greenhouse/Lever/Ashby directly for
a list of companies Ahmed maintains (`recruiting_tracked_companies`), and remembers every posting
it has ever seen (`recruiting_seen_postings`) so re-running the scan only surfaces what's actually
new. Uses Supabase MCP (`execute_sql`, project `dlyombtgtgsavtiqohve`) for all DB reads/writes and
`scripts/ats-scan.mjs` (via Bash) for the HTTP calls — the script only fetches and normalizes
postings; it never touches the database. Never runs automatically.

## Input

Either:

- "scan" / "check for new postings" — runs the scan across all `active = true` tracked companies.
- "add \<Company\> to track (greenhouse/lever/ashby, slug \<slug\>)" — adds a company to the
  watchlist. If Ahmed doesn't know the platform/slug, look at the company's careers page URL — it's
  often `boards.greenhouse.io/<slug>`, `jobs.lever.co/<slug>`, or `jobs.ashbyhq.com/<slug>` — or ask
  him for that link and derive the slug from it.

## Procedure — add a company

1. Confirm the platform + slug actually resolve before saving anything: run the script for just
   that one company (`echo '[{"company":"...","platform":"...","slug":"..."}]' | node
   scripts/ats-scan.mjs`) and check it returns postings (or a valid empty list) rather than an
   error on stderr.
2. Insert into `recruiting_tracked_companies` (`company_name`, `ats_platform`, `ats_slug`,
   `active = true`). Dedupe on `company_name` + `ats_platform` (unique constraint) — if it already
   exists, just re-activate it instead of erroring.

## Procedure — scan

1. **Load the watchlist.** Query `recruiting_tracked_companies where active = true`. If empty, say
   so and offer the add-a-company flow instead of running an empty scan.
2. **Run the script.** Pass the watchlist as JSON on stdin to `scripts/ats-scan.mjs`, mapping
   `ats_platform` → `platform` and `ats_slug` → `slug`. It returns a JSON array of normalized
   postings (`company`, `title`, `location`, `url`, `posted_at`, `jd_text`, `platform`,
   `external_id`) on stdout. A company whose fetch failed (bad slug, API error, board taken down)
   is reported on stderr, not silently dropped — surface those to Ahmed so he can fix the slug or
   deactivate the tracked entry. Update `last_scanned_at = now()` for every company attempted,
   regardless of success.
3. **Dedupe against history.** For each posting returned, look it up in `recruiting_seen_postings`
   by `posting_url`:
   - Not found → new. Insert it (`company`, `title`, `posting_url`, `ats_platform`, `jd_text`,
     `first_seen_at = now()`, `last_seen_at = now()`).
   - Found → already seen. Update `last_seen_at = now()` only. Don't re-present it unless Ahmed
     explicitly asks to see the full current list, not just what's new.
4. **Filter against the bank.** Same rule as role-scout: drop postings whose hard requirements
   clearly don't match anything in the Profile Bank; borderline stays in.
5. **Present the new postings** (company, title, link, one-line fit note grounded in real Profile
   Bank rows — no scores, no invented experience). If nothing new came back, say that plainly
   rather than padding the summary.
6. **Add only what Ahmed confirms.** For each: insert into `recruiting_roles` (`source =
   'scraped'`, `status = 'interested'`, `jd_text`, `posting_url`, `fit_rationale`), then set that
   `recruiting_seen_postings` row's `matched_role_id` to the new role's id so the two stay linked.
   Never insert unconfirmed suggestions.

## Guardrails

- Propose, never auto-add to `recruiting_roles` — every CRM write requires Ahmed's explicit yes,
  same as role-scout.
- The script is fetch-only: outbound HTTP GETs to the three ATS APIs, JSON to stdout. It never
  writes to Supabase or any file — all DB reads/writes happen through this skill via MCP.
- Only `recruiting_`-prefixed tables.
- `recruiting_seen_postings` is a dedup cache, not the CRM — a posting lives there whether or not
  Ahmed ever adds it to `recruiting_roles`, so a posting he declined doesn't keep resurfacing every
  scan.
- Fit notes grounded in real Profile Bank rows only, same standard as role-scout/role-recommend.
