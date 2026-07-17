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

1. Read `resumes/base.tex` and identify the editable regions: bullet items (`\item` lines inside experience/project entries), whole project blocks, and the *content* of the Technical Skills lines. Everything else — preamble, document class, margins, section order, headers, spacing commands — is off-limits.
2. Load the Profile Bank (projects, experience, skills) and the JD. Read `recruiting_profile_experience.notes` too — it holds long-form context (domain framing, technical war stories, architecture detail) that often carries the specific fact a JD is asking for when the bullet variants don't. It is source material, not resume copy: mine it for facts and reword them into the base template's bullet style, never paste it in.
   Decide:
   - which projects to include/drop (most JD-relevant ones in),
   - which bullet variant (short/medium/detailed) fits each slot,
   - how to reword bullets to mirror the JD's language and keyword choices.
   **Bullet budget: ~18 `\item` bullets total across the Experience section.** Hit the budget by dropping the least JD-relevant *project* blocks entirely — never by thinning entries down to 2–3 bullets each. Real employment entries (internships/jobs) always stay; a project block is only worth including if it earns its full bullet set (4–5 bullets), otherwise cut the whole block.
3. **Rewording rules:**
   - Every bullet must trace to a Profile Bank row — any of `problem`/`approach`/`impact`/`notes`/the bullet variants. Never fabricate a metric, technology, or claim not present in the bank.
   - **Bullet style: match the base template's bullets.** They are the template for a reason — short, direct, one strong verb, one fact-dense clause, ~one rendered line (≈125 characters at 11pt). Don't stack subordinate clauses or pile qualifiers; if a rewrite runs to two rendered lines, cut detail until it fits. A bullet may wrap only if the corresponding base bullet already wraps.
   - Rewrites stay within the existing bullet slots — same number of `\item`s per entry unless a whole project block is added/removed.
   - Keep to one page unless the base resume is already longer.
   - Escape LaTeX special characters (%, &, #, _, $) in inserted text.
4. **Technical Skills section — tailor it to the JD:**
   - Reorder categories and items so the JD's most-wanted skills come first; drop items irrelevant to the role.
   - You may add or swap in skills, but only ones present in `recruiting_profile_skills` or already in base (including base's commented-out lines, e.g. the Quantitative Finance line — uncomment it for quant/finance roles). Never invent a skill.
   - Category labels and line formatting stay as in base; only the lists change.
5. **Independent review — before writing the file.** Invoke the `application-reviewer` subagent
   (Agent tool) with: the JD, every drafted bullet/project-block change (old vs. new), the
   Profile Bank rows each one draws from, artifact type `resume`, and the path to
   `resumes/base.tex`. If it returns `revise` with blocking issues (fabrication or structural
   drift), fix them — non-negotiable, never argue past a blocking issue. For non-blocking
   suggestions (JD alignment, redundancy, length), apply what's clearly right; you may keep
   something the reviewer flagged if you disagree, but say so in the summary Ahmed sees.
6. **Versioning (never overwrite):**
   - Next version = current `resume_version` + 1 for that application.
   - Write to `resumes/tailored/<company>-<role-slug>-v<N>.tex`.
   <!-- - Compile with `pdflatex` (or `latexmk -pdf`) into the same directory; verify it compiles and check the page count. If it exceeds one page, trim bullet length (shorter variants), not formatting. -->
7. Update the `recruiting_applications` row: `tailored_resume_path` (the .tex path), `resume_version = N`.
8. Show Ahmed a summary of what changed vs. base (projects in/out, bullets reworded and why, skills-section changes), plus a short reviewer-notes line: what the application-reviewer flagged and whether you fixed it or kept it as-is and why.

## Guardrails

- Structure, formatting, margins, fonts, document class: never touched.
- ~18 bullets total; trim by removing whole project blocks, never by leaving 2–3 bullet stubs.
- Bullets follow the base template's style: short, direct, ~one rendered line each.
- No fabricated content — bank material reworded/reordered only (applies to the skills section too).
- Every draft goes through the `application-reviewer` subagent before it's written to a file —
  never skip step 5 to save time.
- Full version history kept; never delete or overwrite an earlier version.
- Cover letters are handled by the separate `cover-letter` skill, not this one.
