---
name: recruiter-finder
description: Find recruiters/talent-acquisition contacts at a specific company on LinkedIn, log them as CRM contacts with their profile link, and draft (never send) a personalized outreach message. Use when the user asks to find a recruiter, find who's hiring, or get LinkedIn contacts at a company the user's applying to.
---

# recruiter-finder

Finds named recruiting contacts at one company via LinkedIn search, using the `claude-in-chrome`
browser tools against the user's own logged-in LinkedIn session (requires `options.browser` enabled
in `recruiting-os.config.json`; if that MCP isn't configured, say so and stop). Writes confirmed
contacts — with a profile link and a drafted message — through the backend named in that config per
`STORAGE.md` (Supabase MCP `execute_sql` on `recruiting_contacts`, or a markdown file under
`data/crm/contacts/`). Interactive only — no cron, no headless, nothing automatic.

## Input

A company name, usually tied to a role the user's already tracking. If the user doesn't say which role,
check `recruiting_roles` for an existing row (`company ilike '%<name>%'`) and use its title/status/
`fit_rationale` for message context; if none exists, ask what role/context to reference before
drafting a message (names/links can still be found without it).

## Procedure

1. **Load context.** Pull the matching `recruiting_roles` row (title, status, fit_rationale) and any
   Profile Bank material worth referencing (a real project/skill relevant to the role). Check
   `recruiting_contacts` for existing rows at this company to avoid duplicates.
2. **Search LinkedIn.** Open a tab (`tabs_context_mcp` → `tabs_create_mcp` if needed) and navigate to
   `https://www.linkedin.com/search/results/people/?keywords=<Company>%20recruiter`. If the user's
   role is intern/new-grad level, also try `<Company> university recruiter` / `<Company> campus`
   for a second pass — campus recruiters are a better fit than generalist TA for that level.
3. **Extract results.** Use `get_page_text` for names/titles/locations/connection degree, and
   `read_page` (filter `interactive`) on the same results to pair each name with its profile URL
   (the anchor's href). Keep only rows that are clearly Scale-of-company recruiting/TA roles
   (title contains recruiter/talent acquisition/people/TA) — drop unrelated same-name matches.
4. **Rank, don't just list.** Prefer, in order: 1st/2nd-degree connections (mutual path exists) over
   3rd+, then technical/campus recruiters over generalist or regional (non-US, if the user is US-based)
   ones, then more senior/broader-scope titles last (they're a fallback, not the target).
5. **Present a shortlist** (up to ~10): name, title, location, connection degree, profile link —
   flag the top 1-2 picks and why. Never claim a message was sent or a connection made; this step
   is read-only research.
6. **Draft a message per contact the user confirms**, using this template as the default (confirmed
   2026-07-05) — target **~200 characters**, hard cap ~275 (LinkedIn's connection-note limit is
   ~300):

   > Hi \<FirstName\>, hope you're doing well! I applied to the \<role, short form\> role at
   > \<Company\> and would love to connect—happy to share my background in \<1-2 real, relevant
   > areas, e.g. "SWE/AI"\> and learn more about the team. Thank you!

   - `<role, short form>`: drop qualifiers like "Intern"/location suffixes if needed to fit length
     (e.g. "AI Builder Intern (New York / San Francisco)" → "AI Builder").
   - `<1-2 real, relevant areas>`: pulled from Profile Bank tags/skills that genuinely match the
     role — never a generic phrase not grounded in the user's actual background.
   - Keep the em-dash + "Thank you!" closing; don't restructure the template's shape.
   - If a contact is already 1st-degree (so this isn't a cold connection note), a longer free-form
     message is fine, but ask the user before deviating from the template rather than defaulting to
     it.
7. **Write to the CRM** only for contacts the user confirms: insert/update `recruiting_contacts`
   (`name`, `company`, `role_id` if applicable, `title`, `linkedin_url`, `draft_message`, `notes`
   for location/connection-degree context). Dedupe on `linkedin_url`, else name+company. The
   webapp's Contacts page and the role detail page's Linked Contacts panel surface `linkedin_url`
   and `draft_message` directly — that's where the user reads/copies the message from, not chat.

## Guardrails

- Read-only on LinkedIn: search and view profiles only. Never send a connection request, message,
  InMail, or click anything beyond navigation/search — drafting text is as far as this goes.
- Never fabricate a profile URL or title — only what's actually visible on the search results/
  profile page for that person.
- Messages are reworded from real Profile Bank/role material only, same standard as cover-letter
  and resume-tailor — no invented claims.
- Propose, never auto-add — every CRM write requires the user's explicit yes, same as role-scout.
- Only `recruiting_`-prefixed tables.
