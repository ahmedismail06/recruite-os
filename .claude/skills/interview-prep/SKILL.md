---
name: interview-prep
description: Build a company-tailored behavioral interview prep doc — rewrite Ahmed's standing HR answers against a specific role's JD and current Profile Bank, research the interview format and company values, and publish to Google Drive. Use when Ahmed says he has a HireVue, phone screen, behavioral round, or Superday coming up, or asks to prep answers for a company.
---

# interview-prep

Produces a per-company interview prep doc: Ahmed's standing behavioral answers rewritten for one
role, cut to the interview's actual time budget, plus format research, likely extra questions, and
delivery notes. Reads Profile Bank and the role's JD/fit rationale from Supabase MCP
(`execute_sql`, project `dlyombtgtgsavtiqohve`), the standing answers from Google Drive, and
publishes the result back to Drive.

**Standing answer bank:** the Google Doc **"HR Questions"**
(`1oVRHnZ8sJY8AHXB9XLD92bmvvGgIm-77INDUWSKOMJ4`) — Ahmed's generic, company-agnostic answers. It is
the *source*, never the output. Per-company docs are new files; this doc is left untouched.

## Input

A company and interview type ("Morgan Stanley HireVue", "Citadel phone screen"). If he doesn't name
the role, match `recruiting_roles` on `company ilike '%<name>%'` and confirm which row if several.

## Procedure

1. **Load the role.** Pull `recruiting_roles` (`title`, `jd_text`, `fit_rationale`, `status`,
   `posting_url`). `fit_rationale` is the highest-value field here — it already names the honest
   gaps, and those become answer material (see step 5). If no row exists, ask for the JD rather
   than prepping blind.
2. **Load the Profile Bank.** `recruiting_profile_projects` and `recruiting_profile_experience`,
   **including `notes`** — that field holds the long-form war stories, domain primers, and
   "interview question → material" mappings that most answers are built from. It is usually richer
   than the bullet fields.
3. **Read the standing answers** from the HR Questions doc (Drive `read_file_content`). Note which
   are stale, which are blank, and which are pitched at a *different* company — answers written for
   a firm Ahmed has since joined must be rebuilt, not lightly edited.
4. **Research the format.** WebSearch for the company + interview type: number of questions, prep
   and answer time limits, retries, completion window, and whether the track sees technical
   questions. Also pull the company's stated core values. Glassdoor and interview-prep sites are
   fine sources; treat specific numbers as approximate and say so.
5. **Draft the answers.** One per standing question, plus any the research says are likely.
   - **Budget words to the clock.** ~150 spoken words per minute. A 1.5–2 minute answer is
     **~200 words**, targeting ~85–95 seconds so it lands early rather than getting cut off. This
     is the most common failure in the standing doc — those answers run 300–400 words. State the
     budget in the doc so Ahmed can re-check as he practices.
   - **Every claim traces to a Profile Bank row or something Ahmed just said.** Same standard as
     resume-tailor and cover-letter. Never invent a metric, a technology, or a story.
   - **Fill blank questions from real material** rather than leaving them empty — the Profile Bank
     `notes` almost always contain a usable story.
   - **Flag drift, don't silently adopt it.** Where the standing doc claims something the Profile
     Bank doesn't record, keep it out of the answer and call it out inline: "this isn't in the
     Profile Bank — if it's real, put it back." Do not resolve the conflict by assuming.
   - **Turn a real gap into a reason.** Where `fit_rationale` names an honest weakness against the
     JD, prefer volunteering it over hiding it, framed as what the internship is for. Say in the
     doc that this is a judgment call and how to cut it if he'd rather not raise it.
   - Recommend a track/team where the posting has several, based on `fit_rationale`, and name the
     one **not** to pitch.
6. **Add the surrounding sections:** format table (from step 4), other questions worth having
   ready with a one-line pointer at the material for each, light technical quick-hits if the track
   sees them, a company-values → real-hook table, and delivery notes for the medium (one-way video
   has different failure modes than a live call).
7. **Publish to Drive.** `create_file` with `contentMimeType: "text/markdown"` (converts to a real
   Google Doc), `parentId` matching the HR Questions doc's parent, titled
   `HR Questions — <Company> <Year> <Program> (<Interview type>)`.
8. **Read the new file back and verify the content landed.** Non-negotiable — see Guardrails.
9. **Report** the Drive link, what changed from the standing answers and why, the judgment calls
   from step 5, and anything Ahmed needs to verify himself. Offer to log the interview as a
   `recruiting_interactions` row and advance the application `stage` — offer, don't do it unasked.

## Guardrails

- **The Drive connector is create-and-read only.** There is no update, edit, or delete tool, and
  Google Docs *tabs* cannot be created through it at all. If Ahmed asks for a new tab inside an
  existing doc, say so up front and produce a separate doc he can paste in — don't discover this
  mid-task.
- **Always read the published file back.** `create_file` returns `fileSize: 1` regardless of what
  was actually uploaded, so the response is not evidence of success. A failed upload cannot be
  fixed in place — it leaves an orphan doc Ahmed has to trash manually, so get the content right
  the first call rather than sending a placeholder.
- Markdown converts well except **bold inside table cells**, which renders as literal `**`. Keep
  table cells plain, or accept the artifact and mention it.
- Never touch the HR Questions doc. Per-company docs are always new files.
- No fabrication. Answers reword real Profile Bank material only — never invent a metric, project,
  employer, or outcome, and never smooth over a conflict between the standing doc and the bank.
- **Willett Advisors confidentiality:** architecture, patterns, algorithms, and stack are fine to
  describe. Never schema or table names, entity/fund/manager names, AUM figures, or actual returns.
  This rule belongs *in* the generated doc too, since Ahmed is reading from it under time pressure.
- Interactive only — Ahmed triggers this. No cron, no headless.
