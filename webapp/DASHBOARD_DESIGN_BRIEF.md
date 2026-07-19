# Recruiting OS — Dashboard Design Brief

For redesigning the home page (`app/page.tsx`) of the Recruiting OS webapp. Single user (the user), desktop-first but must not break on mobile. Next.js App Router + Tailwind; data is server-fetched from Supabase (tables: `recruiting_roles`, `recruiting_applications`, `recruiting_contacts`, `recruiting_interactions`, plus profile bank). No auth, no multi-user states needed.

## The core problem with the current dashboard

It's a kanban board and nothing else. It shows *where things are* but not *what to do*. Every visit requires scanning six columns to reconstruct the state of the search. It also looks like default Tailwind — slate-on-white, no hierarchy, no identity.

## Design goal (one sentence)

Opening the dashboard should answer, in under five seconds: **"What needs my attention today, and how is the search going?"** — with the pipeline as supporting detail, not the headline.

## Information architecture (top to bottom)

### 1. Action queue — the hero of the page
A prioritized "Today" panel, not a banner. Sources, in priority order:
- **Follow-ups overdue** — applications silent ≥14 days (rule already in `applicationFollowUpDue`) and contacts silent ≥7 days. Show company/person, days overdue, and a one-click path to the role/contact.
- **Next actions with due dates** — from `recruiting_applications.next_action` + due date.
- **Interviews/screens upcoming** — anything in screening/interviewing stage, most recent activity first.

Each item is a row with: urgency dot, what it is, how stale it is ("18d silent"), and one action link. Empty state should be a genuine reward: "Nothing due. Go find something with /role-scout." — not a gray void.

### 2. Vital signs — one compact stat row (not big dashboard cards)
Four or five small stats, single line each, no giant number tiles:
- Active applications (not rejected/ghosted)
- In interview stages now
- Response rate (roles with any response ÷ roles applied)
- Median days in current stage
- Added this week

These are trend-awareness numbers, not KPIs to celebrate — keep them quiet, monospace numerals (Geist Mono is already loaded), small labels.

### 3. Pipeline — keep the kanban, fix its economics
- Collapse empty columns to slim vertical rails (label + zero count) instead of full-width dashed "empty" boxes — six 256px columns when only two have cards wastes the whole viewport.
- Cards carry signal, not just names: company + title, **days-in-stage as the freshness cue** (color shifts as it ages: fresh → neutral → amber → red at the 14-day rule), follow-up-due badge, resume version chip if tailored.
- `rejected` and `ghosted` belong in a de-emphasized zone — collapsed by default or visually muted at the end — they're retained for pattern analysis, not daily attention.
- Column counts in the header ("applied · 7") so the board is scannable without reading cards.

### 4. Recent activity — thin footer strip (optional but cheap)
Last 5 interactions (from `recruiting_interactions`): "emailed Jane @ Stripe — 2d ago". Gives the page a pulse and doubles as a log-what-happened prompt.

## What does NOT belong on the dashboard

- The add-role form as a permanent header fixture. Replace with a single "+ Add role" button opening a modal/drawer (company, title, paste-JD textarea). The primary workflow for adding roles is the Claude Code skills anyway.
- Profile bank content (has its own page).
- Charts for their own sake. One tiny sparkline (applications/week) is the ceiling; skip pie charts of statuses entirely — the kanban *is* that chart.

## Visual direction

Current look is template-default. Direction: **quiet terminal-professional** — this is a personal ops tool, closer to Linear/a trading blotter than a marketing site.

- **Foundation:** near-white warm background (not pure `slate-50`), one accent color used *only* for interactive elements and the action queue's urgency markers. Everything else stays neutral. Dark mode is worth doing (`next-themes` pattern is familiar from the user's other apps).
- **Typography:** Geist Sans for UI, Geist Mono for all numbers/dates/counts (already loaded — use them deliberately). Tighten the type scale: one page title, small uppercase section labels, everything else 13–14px.
- **Status colors:** a single consistent hue ramp across the app — interested (neutral) → applied (blue) → screening/interviewing (violet/purple) → offer (green) → rejected/ghosted (desaturated gray, never red — red is reserved for *overdue*, which is actionable).
- **Density:** compact rows and cards, generous *section* spacing. The board should fit 6 columns without horizontal scroll at 1440px.
- **Texture:** hairline borders over shadows; radius consistent (8px); no gradients, no glassmorphism.

## Interaction notes

- Everything on the dashboard links somewhere: stat → filtered view, queue item → role/contact detail, card → role page.
- Card stage changes: drag between columns is nice-to-have; a stage select on the card's context menu is enough for v1 (server actions already exist in `app/actions.ts`).
- Keyboard: `/` focuses a global company/title filter that live-filters board + queue.

## Success test

Load the page with real data and ask:
1. Can you name today's 3 most urgent items without scrolling? 
2. Can you tell whether the search is healthier than last week from the stat row alone?
3. Does anything on screen exist purely as decoration? (If yes, cut it.)
