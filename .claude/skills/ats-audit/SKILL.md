---
name: ats-audit
description: Audit Ahmed's base resume the way an applicant tracking system would against a batch of roles (default — every role added today) — score each role now, after a cross-role base-resume wording pass, and at the best bank-backed tailoring ceiling, and surface blockers where the Profile Bank has nothing to offer. Use when Ahmed asks to ATS-audit/score/rate his resume against new postings, or asks what it would take to get to a 90%+ match.
---

# ats-audit

Batch ATS-style audit of `resumes/base.tex` against many roles at once. It sits between
`role-scout`/`ats-scan` (which add roles) and `resume-tailor` (which tailors for one role). It
measures keyword/eligibility match, improves the **base** resume where a change helps many roles,
and tells Ahmed which gaps are blockers that only new experience can close. Reads Supabase
(`dlyombtgtgsavtiqohve`) through the recruiting-skills MCP `db_select`/`db_update` tools.

Scoring rubric: [`rubric.md`](rubric.md) — authoritative for categories, points, knockout cap,
JD sourcing, confidence levels, and the per-role output block. Scores here are ATS match rates
Ahmed explicitly asked for, distinct from `role-recommend`'s no-score fit prose.

## Input

- Default: roles with `date_added` on today's local date (America/Chicago).
- Or: a date, a company list, or role ids.

## Procedure

1. **Load the batch.** `recruiting_roles` (`id, company, title, status, jd_text, fit_rationale,
   posting_url, date_added`). Skip `rejected`/`not_interested`/`posting_closed` unless named.
   Load the full Profile Bank including `recruiting_profile_experience.notes`.
2. **Parse check (once per run).** Compile `base.tex` and extract text (`pypdf`) to see what an
   ATS sees. If the local TeX install can't compile (TeX Live basic lacks `fullpage`, `titlesec`,
   `marvosym`, `enumitem`, `fontawesome5`; tectonic has failed here too), extract text from the
   newest PDF in `resumes/tailored/` — same preamble, same parse behavior — and say so. Record
   findings as the shared category-A score. Known issues as of 2026-09-13: header icon glyphs
   extract as text glued to the email; heading tabulars extract title and dates with no separator.
   Format fixes are Ahmed's call — report them, never apply them unasked.
3. **Draft the base update** in the scratchpad (never edit `base.tex` yet). Cross-role changes
   only: skills-list keywords the bank supports but the rendered resume omits, languages/tools
   used in bullets but not named, typos, raw `~` rendering as a space, filler clauses cut to make
   room. Same rules as `resume-tailor`: every word traces to the bank or the existing base; bullet
   count, entries, section order, and formatting unchanged; two project blocks and both internships
   stay; ~one rendered line per bullet. Role-specific rewording belongs to `resume-tailor`, not here.
4. **Fan out** (Agent tool, run in parallel):
   - `application-reviewer` on the base draft — old → new list, the bank rows each change uses,
     both file paths. Also ask for a separate list of *pre-existing* base claims the bank doesn't
     support.
   - Scoring agents (`general-purpose`), ~6 roles each. Give each: the rubric path, both resume
     paths, the role ids, the shared category-A score and why, Ahmed's education facts, and the
     JD-sourcing order. They save any JD they find to `<scratchpad>/jds/<role-id>.md`, never write
     the DB or repo, and return the rubric's per-role block plus cross-role notes.
5. **Resolve review.** Blocking reviewer issues (fabrication, structural drift) get fixed. Fold in
   cross-role suggestions from the scoring agents only if bank-backed and they help several roles.
6. **Save the base update as a separate file.** Write the reviewed draft to
   `resumes/base-ats.tex` (versioned `base-ats-v<N>.tex` if one already exists — never overwrite).
   **Never overwrite `resumes/base.tex`** — Ahmed keeps it as-is (2026-09-13). Per-job resumes are
   built from `base-ats.tex` by `resume-tailor` into `resumes/tailored/`.
7. **Missing JDs.** Collect every `NEEDS JD` role and ask Ahmed to paste those JDs — list company,
   title, and where the search looked. Score them when he does; don't score from a blurb.
8. **Save found JDs.** For roles whose `jd_text` is null, `db_update` it with the full JD the agents
   found (source URL on the first line). Where `jd_text` is an AI-written summary, show Ahmed the
   replacement and confirm before overwriting.
9. **Write the report** to `resumes/ats-audits/<YYYY-MM-DD>.md` (gitignored): summary table
   (company, role, confidence, initial → after-base → ceiling, top blocker, deadline), what changed
   in the base and why, the parse/format fixes awaiting approval, a **blockers roll-up** grouping
   bank gaps by how many roles each one costs (the "what new experience would move the most
   scores" list), then the per-role blocks. Sort roles by urgency (open with a close deadline
   first), then by ceiling.
10. **Show Ahmed** the summary table, the base diff summary with reviewer notes, the blockers
    roll-up, the knockouts, and the NEEDS JD list. Offer `resume-tailor` (starting from
    `base-ats.tex`) for open roles worth applying to — not knockouts or unposted roles.

11. **Tailor on request.** For the roles Ahmed picks, run `resume-tailor` from `base-ats.tex`. Drafts go to the
    scratchpad first; fan out drafting agents (~3 roles each) and have each score its draft against
    `rubric.md` versus the audit ceiling. Then run one `application-reviewer` per draft (reviewers can't
    query the DB, so write the relevant Profile Bank rows verbatim to a scratch file for them), fix
    blocking issues, copy to `resumes/tailored/` (never overwrite), and add a tailored-resumes table
    to the report. Recurring blocking issues to pre-empt: claiming hand-built authorship of
    Claude Code-built work, borrowing JD phrases the bank doesn't contain, and reordering bullets
    within an entry (not allowed — only wording, project blocks, and skills lists change).

## Guardrails

- No fabricated content — base rewording and ceilings use Profile Bank material only. A JD skill the
  bank lacks is a blocker, never a quiet addition.
- Never guess a JD. Search, then ask Ahmed.
- Never overwrite `resumes/base.tex`. The reviewed wording goes to `resumes/base-ats.tex`; per-job
  versions come from `resume-tailor`. Never touch existing `resumes/tailored/` versions.
- Formatting and structure fixes (header icons, heading tabulars) are proposed, not applied.
- GPA stays off the base. Count it in the ceiling — and tell `resume-tailor` to add it —
  only for roles whose JD sets a GPA minimum or requires GPA on the resume.
- Scores are keyword-match estimates: say so once in the report, and don't present them as offer odds.
- Never delete CRM rows; only `jd_text` may be written, and summaries are replaced only with consent.
- Interactive only — Ahmed triggers this. No cron, no headless.
