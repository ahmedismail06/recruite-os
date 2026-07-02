---
name: resume-tailor
description: Tailor Ahmed's LaTeX resume to a specific job description using Profile Bank bullet variants — edits bullet content and project inclusion only, never structure or formatting. Use when Ahmed asks to tailor/customize his resume for a role or application.
---

# resume-tailor

Produces a versioned, JD-tailored copy of Ahmed's base LaTeX resume. Uses Supabase MCP (`execute_sql`) against project `dlyombtgtgsavtiqohve` for Profile Bank reads and application updates.

**Base template:** `resumes/base.tex` in this repo. If it doesn't exist yet, stop and ask Ahmed to provide his `.tex` file — do not invent a template.

## Input

- A JD (pasted, or referenced from `recruiting_roles.jd_text`).
- Which application it's for. If no `recruiting_applications` row exists for that role yet, offer to create one first (recruiting-crm flow).

## Procedure

1. Read `resumes/base.tex` and identify the editable regions: bullet items (`\item` lines inside experience/project entries) and whole project blocks. Everything else — preamble, document class, margins, section order, headers, spacing commands — is off-limits.
2. Load the Profile Bank (projects, experience, skills) and the JD. Decide:
   - which projects to include/drop (most JD-relevant ones in),
   - which bullet variant (short/medium/detailed) fits each slot,
   - how to reword bullets to mirror the JD's language and keyword choices.
3. **Rewording rules:**
   - Every bullet must trace to a Profile Bank row. Never fabricate a metric, technology, or claim not present in the bank.
   - Rewrites stay within the existing bullet slots — same number of `\item`s per entry unless a whole project block is added/removed.
   - Keep to one page unless the base resume is already longer.
   - Escape LaTeX special characters (%, &, #, _, $) in inserted text.
4. **Versioning (never overwrite):**
   - Next version = current `resume_version` + 1 for that application.
   - Write to `resumes/tailored/<company>-<role-slug>-v<N>.tex`.
   - Compile with `pdflatex` (or `latexmk -pdf`) into the same directory; verify it compiles and check the page count. If it exceeds one page, trim bullet length (shorter variants), not formatting.
5. Update the `recruiting_applications` row: `tailored_resume_path` (the .tex path), `resume_version = N`.
6. Show Ahmed a summary of what changed vs. base (projects in/out, bullets reworded and why) and the PDF path.

## Guardrails

- Structure, formatting, margins, fonts, document class: never touched.
- No fabricated content — bank material reworded/reordered only.
- Full version history kept; never delete or overwrite an earlier version.
- Cover letters are out of scope (v1).
