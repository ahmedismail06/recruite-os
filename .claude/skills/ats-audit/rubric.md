# ATS audit rubric

Scores approximate what a keyword-match ATS layer (Workday/Greenhouse/iCIMS search and ranking,
Jobscan-style match rate) sees — not a fit judgment and not a prediction of an offer. Most ATSs do
not auto-reject on a score; the practical stakes are knockout questions and whether a recruiter's
keyword search surfaces the resume. Be strict: a keyword that is not in the *rendered* text does not
count (LaTeX `%` commented-out lines are invisible to an ATS).

## Categories (100 points)

| # | Category | Pts | How to score |
|---|---|---|---|
| A | Parseability & format | 10 | Single column, standard headings (Education / Experience / Projects / Skills), contact info as plain text, parseable dates, clean reading order. Same for every role — use the shared parse check result. |
| B | Required hard-skill keywords | 30 | List every required/core skill, language, tool, and concept in the JD. Exact term in rendered text = full credit; close variant (Postgres↔PostgreSQL, REST↔RESTful) = half; absent = 0. Score = 30 × credit / count. |
| C | Preferred hard-skill keywords | 15 | Same method over preferred/nice-to-have/"a plus" items. If the JD lists none, score C proportionally to B. |
| D | Keywords in context | 15 | Share of the B+C keywords that the resume has that also appear inside an Experience/Project bullet, not only the Skills list. Recent roles (internships) weigh more than old projects. |
| E | Title & domain alignment | 10 | Role-family terms (software engineer, backend, full-stack, data engineering, infrastructure) and domain terms (asset management, fintech, trading, distributed systems, AI evaluation) in titles/bullets. |
| F | Education & eligibility | 15 | Degree field, graduation window, class standing, program dates. Unknown items (work auth, GPA not listed) are neutral, but note them. |
| G | Responsibility phrasing | 5 | Does the resume mirror the JD's verbs — design, build, test, deploy, monitor, own end-to-end, collaborate with product? |

**Knockout cap:** if a stated hard requirement is failed outright (e.g. graduation year outside the
window), cap the total at 40 and list it first under blockers, whatever the keyword score.

## Three scores per role

1. **Initial** — the current base resume as-is.
2. **After base update** — the revised base (cross-role wording and skills changes).
3. **Tailored ceiling** — best score reachable with role-specific tailoring using **only** Profile
   Bank material (`recruiting_profile_*` rows, including `notes`) plus the skills table. Never
   assume a skill, metric, or experience that is not in the bank.

If the ceiling is below 90, the gap is made of **blockers**. List each one with the missing JD
requirement, its category and points, and why nothing in the bank covers it. These are the items
only new experience (a project, a course, a cert) can fix.

## JD sourcing and confidence

Find the real JD before scoring: `jd_text` → the `posting_url` → a web search (company careers
site / ATS board first, then aggregators such as LinkedIn, Indeed, Handshake, Simplify). Do not
score from `fit_rationale` or a program blurb alone — if no JD can be found, **don't guess**: mark
the role `NEEDS JD` so Ahmed can be asked to paste it.

- **High:** full current-cycle JD text.
- **Medium:** partial JD (stack list without responsibilities), or the official prior-cycle posting
  for a recurring program that hasn't reposted yet — name the source and cycle.
- **NEEDS JD:** nothing usable found. No score.

## Per-role output

```
### <Company> — <Title>
Confidence: High|Medium|Low (JD source: …)
Scores: Initial NN · After base update NN · Tailored ceiling NN
Category breakdown (initial → after → ceiling): A … B … C … D … E … F … G …
Keywords matched: …
Keywords missing but bank-backed (tailoring fixes): term → bank source
Blockers (no bank evidence): term — category/points — why
Knockouts/eligibility flags: …
Top 3 tailoring moves to reach the ceiling: …
Deadline/urgency: …
```
