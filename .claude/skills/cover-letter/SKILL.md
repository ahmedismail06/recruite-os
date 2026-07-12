---
name: cover-letter
description: Draft a JD-tailored cover letter in Ahmed's LaTeX letter format, using real Profile Bank material only. Use when Ahmed asks to write/draft a cover letter for a role or application.
---

# cover-letter

Produces a versioned, JD-tailored cover letter from Ahmed's base LaTeX letter shell. Uses Supabase MCP (`execute_sql`) against project `dlyombtgtgsavtiqohve` for Profile Bank reads and application updates.

**Base template:** `cover-letters/base.tex` in this repo. Its header (name, contact links) mirrors `resumes/base.tex` — if Ahmed's contact info ever changes, update both. Structure is modeled on a formal reference letter Ahmed provided (`cover-letters/template.doc` — a generic sample from an unrelated person; only its *shape* is reused, never its content): a "To," recipient block, and four body paragraphs each with a fixed job, not free-form prose.

## Input

- A JD (pasted, or referenced from `recruiting_roles.jd_text`).
- Which application it's for. If no `recruiting_applications` row exists for that role yet, offer to create one first (recruiting-crm flow).
- A named hiring contact, if Ahmed has one (check `recruiting_contacts` linked to the role).

## Procedure

1. Read `cover-letters/base.tex`. The header block (name, contact icons/links), margins, and document class are fixed — never touched. Only the regions marked `% === EDITABLE: ... ===` (date, recipient, salutation, body) change per letter.
2. Load the Profile Bank (`recruiting_profile_projects`, `recruiting_profile_experience`) and the JD/company/role from `recruiting_roles`. If Ahmed gives you a more complete/authoritative project description in conversation than what's in a Profile Bank row (e.g. a fuller project charter), use the authoritative version for the letter — and offer to update the Profile Bank row too (profile-bank skill's confirm-before-write rule still applies; don't write it without a yes).
3. Draft the letter as **four body paragraphs, each with a fixed rhetorical job** — this is not free-form; don't collapse or reorder them:
   1. **Opening** — name the role and company, tie in one concrete real experience that's directly relevant to the role's core mandate, state genuine interest, and ask for an opportunity to interview. No generic enthusiasm ("your innovative culture") — the tie-in must be specific.
   2. **Background** ("As my resume indicates...") — academic program/status + current role, then **one quantified analytical/problem-solving achievement** pulled from a Profile Bank `impact` field.
   3. **Collaboration** — a real project narrative that demonstrates technical judgment or working with others (e.g. escalating ambiguity to a senior engineer, cross-functional coordination) — sourced from a Profile Bank `approach`/`impact`, not asserted as a bare trait.
   4. **Leadership** — one concrete, quantified leadership example (team size, outcome) from a Profile Bank row.
   Then a **closing paragraph**: reiterate interest, offer to discuss further, thank them, look forward to an interview.
   - **Recipient:** "To," then named contact + title if known else "Hiring Team," then company name. Never fabricate a street address or a name Ahmed hasn't given you.
   - **Salutation:** "Dear [First Last]," if a named contact exists, else "Dear Hiring Team,".
   - **Sign-off:** "Sincerely," — single closing line, not a doubled "Sincerely, Best regards,".
   - Target ~250–350 words across the five paragraphs — one page total including the header.
4. **Rewording rules (same as resume-tailor):**
   - Every claim must trace to a Profile Bank row (`problem`/`approach`/`impact`/`summary`/bullet fields) or something Ahmed just told you directly. Never fabricate a metric, technology, employer, address, or claim not present in either.
   - If the Profile Bank doesn't have material for one of the four paragraph slots (e.g. no dedicated "communication" story), don't invent one — repurpose the closest real narrative that honestly fits the slot's *function*, and say so when you show the draft.
   - Mirror the JD's language/keywords where it's honestly applicable — don't force it.
   - Escape LaTeX special characters (%, &, #, _, $) in inserted text.
5. **Independent review — before writing the file.** Invoke the `application-reviewer` subagent
   (Agent tool) with: the JD, the full drafted letter text, the Profile Bank rows each paragraph
   draws from, artifact type `cover-letter`, and the path to `cover-letters/base.tex`. If it
   returns `revise` with blocking issues (fabrication or a collapsed/reordered paragraph
   structure), fix them — non-negotiable, never argue past a blocking issue. For non-blocking
   suggestions (JD alignment, redundancy, length, tone), apply what's clearly right; you may keep
   something the reviewer flagged if you disagree, but say so when you show the draft.
6. **Versioning (never overwrite):**
   - Next version = current `cover_letter_version` + 1 for that application.
   - Write to `cover-letters/tailored/<company>-<role-slug>-v<N>.tex`.
   <!-- - Compile with `tectonic` (or `pdflatex`/`latexmk -pdf`) into the same directory; verify it compiles and is one page. -->
7. Update the `recruiting_applications` row: `tailored_cover_letter_path` (the .tex path), `cover_letter_version = N`.
8. Show Ahmed the full letter text and the PDF path before considering the task done — he should read it, since cover letters are more exposed to tone/phrasing judgment than resume bullets. Include a short reviewer-notes line: what the application-reviewer flagged and whether you fixed it or kept it as-is and why.

## Guardrails

- Header, margins, fonts, document class: never touched.
- Four fixed-role body paragraphs (opening/background/collaboration/leadership) + closing — don't restructure into a generic hook-and-recap letter.
- No fabricated content — Profile Bank material (or facts Ahmed just stated) reworded only, same standard as resume-tailor. Never invent a recipient address.
- Every draft goes through the `application-reviewer` subagent before it's written to a file —
  never skip step 5 to save time.
- ~250–350 words across five paragraphs, one page.
- Full version history kept; never delete or overwrite an earlier version.
- This skill only produces a file. Sending (email, portal upload, etc.) is Ahmed's action, never automatic — consistent with the no-auto-send rule for email in this repo.
