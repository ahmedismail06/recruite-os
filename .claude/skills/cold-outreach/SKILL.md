---
name: cold-outreach
description: Given a company website, find people Ahmed can actually cold email or LinkedIn-message — three per firm: the technology head, a junior/peer-level person, and someone in HR, with alumni prioritised — and draft (never send) a short outreach message from real Profile Bank material. Use when Ahmed gives a company site/name and asks who to reach out to, or asks for a cold email or InMail draft.
---

# cold-outreach

Complements `recruiter-finder` (which searches Ahmed's logged-in LinkedIn for recruiters at a
company he has already applied to). This skill starts from a company website with no posting
required, works from public web sources, and targets the people who run or sit on the technology
team. Interactive only — no cron, no headless, nothing automatic.

## Input

A company website or name. No role is needed. If the site belongs to a fund vehicle, holding
company, or other shell with no staff, identify the operating entity that employs people (e.g. the
investment manager) and say so up front.

## Procedure

1. **Find three contacts per firm (set by Ahmed 2026-10-06 — "exposure across the board").**
   1. **Technology head** — CTO, CIO, head of engineering, or the founder at a very small firm.
   2. **A junior / peer-level person** — an engineer, data or quantitative analyst a few years
      out of school. They reply more often than senior strangers and can refer upward.
   3. **Someone in HR** — recruiter, talent lead, HR/people director; the Chief of Staff or
      Chief Administrative Officer when the firm has no HR staff.
   - **Alumni take priority in every slot.** Search for a UW–Madison or Posse alum first; an alum
     fills whichever slot they fit and is flagged as the first person to contact (alumni reply at
     roughly 20–40% versus 5–15% fully cold).
   - If a slot can't be filled, say so plainly; never pad it with someone whose role or employer
     is unclear.
   - Sources: the company's own team/about pages, then WebSearch, then aggregator pages. Use
     Playwright when a page needs rendering. For LinkedIn, use `claude-in-chrome` against
     Ahmed's logged-in session (he approved this 2026-10-06): find the company page via company
     search, open `/company/<slug>/people/`, and filter with `?keywords=` — "Wisconsin" for
     alumni, "engineer OR developer OR software OR technology OR data" for technology staff,
     "talent OR human resources OR recruiting OR HR" for HR. Read the people page only; opening
     an individual profile shows them a profile view, so do that only when sending a request.
   - Watch for same-name companies (e.g. Pershing Square vs BNY Pershing) and drop anyone whose
     employer can't be pinned to the right firm.
2. **Find the email pattern.** Look for a published address first. Otherwise infer from the
   company's dominant format (RocketReach / similar "email format" pages) and any masked address
   for that person.
3. **Present the shortlist.** Per person: name, title, why they're a good target, source link,
   email. Always label each address **published** or **inferred**, and each title **confirmed on a
   page I opened** or **from a search snippet only**. Say plainly when no HR contact or no alum was
   found, and when the "engineering" team is really IT/systems rather than software.
4. **Draft only when Ahmed asks.** Don't draft or log to the CRM by default.

## Message rules

- **Email body: 50–125 words.** Five sentences is the target shape.
- **Subject (format set by Ahmed, 2026-10-06):** under about 50 characters, with the strongest
  credential in the first ~37 so it survives truncation in phone inboxes (Gmail and Outlook on
  iPhone show roughly 37–40 characters). Always present subjects as a table of about five
  options — columns "Subject line" and "Why it works" — with honest trade-offs in the second
  column, then name a pick. Cover these angles:
  - credential first — **"Former Willett Advisors intern, UW–Madison CS" is the fixed default
    (confirmed by Ahmed 2026-10-06). Always put this exact subject on the draft; the other rows
    are alternatives he can swap in, never substitutes chosen for him.** He prefers leading with
    Willett and turned down a subject built on the AI trading project;
  - the Bloomberg's-family-office hook, flagged as possible name-dropping;
  - a small-ask question naming the firm ("Quick question about tech at <Company>") — question
    subjects and company-name mentions both lift opens/replies in vendor data;
  - a "Willett Advisors → <Company>?" style line, flagged as cute for a finance audience;
  - an ask-first line ("15 minutes to learn about your tech team?"), flagged as saying nothing
    about who he is.
  For an alum, add a shared-school option. Never offer "student interested in <Company>" — he
  called that boring twice.
- **LinkedIn InMail: under ~400 characters.** Connection-request notes: ~200 characters, hard cap
  ~275.
- **One small ask** — a 15-minute call for advice. Don't ask for an internship outright in the
  first message unless Ahmed says to.
- **One sentence specific to that firm**, rewritten per firm. Never reuse the previous firm's line.
- **Opening:** "My name is Ahmed Ismail", then school, majors, the finance minor, and graduation
  date (as on `resumes/base.tex`).
- **Proof of work:** one concrete result from the Profile Bank (e.g. the Willett ~13s → ~120ms
  figure) and the AI Hedge Fund repo link in the signature
  (`github.com/ahmedismail06/AI-Hedge-Fund`).
- **Closing line (Ahmed, 2026-10-06):** every message ends with "Thank you for your time," —
  email, InMail, and follow-ups alike.
- **No signature block on school-account emails (Ahmed, 2026-10-06):** his Outlook account adds
  its own signature, so end the body at that closing line with no name or link lines underneath, and
  put the repo link inline in the sentence that mentions the project. Gmail drafts and LinkedIn
  messages still need his name at the end.
- **AI Hedge Fund in the body (Ahmed, 2026-10-06):** mention it in one sentence whenever it's
  possible and relevant — the firm builds AI/agentic products, the reader is an engineer, or the
  firm trades or invests. Call it a "multi-agent AI trading system" and always say it is "running
  in paper trading"; don't write "AI hedge fund" in the sentence itself. If it would push the body
  past 125 words, drop the Willett latency figure to make room. Leave it as the signature link
  only when the reader is HR/recruiting or the firm has no AI or investing angle.
- **Resume line (Ahmed, 2026-10-06):** for email, use "I've attached my resume for your
  reference." as its own sentence just before the closing line, and remind Ahmed to attach it by
  hand — neither draft channel can add files.
- **One email per person, always (agreed 2026-10-06).** Never address two people in one email —
  "would either of you" lets each assume the other will answer. Adjust the ask to the reader:
  the technology head is asked about the team and what they look for; the junior person is asked
  about their day-to-day work and how they got there; HR is asked about technology roles and how
  hiring works. Send only if Ahmed asks for a joint email by name.
- Ahmed edits wording freely. When he pastes his own version, use it as written, fill any bracketed
  placeholder, and flag what was filled in.

## Delivery

- **In chat** by default.
- **School account** — `node scripts/outlook-draft.mjs --to … --cc … --subject … --body-file …`
  opens a pre-filled Outlook compose window. Cc his personal Gmail when he asks.
- **Personal account** — Gmail MCP `create_draft`.
- **LinkedIn** — text in chat for Ahmed to paste; with Premium he sends as InMail without
  connecting first.

## Logging to the CRM (when Ahmed asks to record what was sent)

- Verify emails before logging: the Gmail cc copy proves a school-account email went out. Search
  Gmail for the recipient domains (`newer_than:2d (<domain> OR …)`) and log only what appears,
  using its real send time, subject, and thread id.
- One `recruiting_contacts` row per person (name, company, title, email, `linkedin_url`,
  `last_touch_date`, `last_touch_direction = 'sent'`; LinkedIn note text in `draft_message`;
  `notes` says whether the address was supplied, published, or inferred). Dedupe on name+company.
- One `recruiting_interactions` row per person per touch: `type = 'email'` with
  `gmail_thread_id`, and `type = 'other'` for a LinkedIn connection request.
- Emails with identical subjects get threaded together in Gmail, so two firms can share one
  thread id — say so in the summary.

## Follow-up and timing (tell Ahmed, don't automate)

- **Stagger the three emails; Ahmed schedules the sends (agreed 2026-10-06).** Draft all three in
  one sitting, each in its own Outlook compose window, and give Ahmed a send slot for each so he
  can set it with Outlook's own "Schedule send" before closing the window:
  1. junior person or alum — first available slot;
  2. technology head — two to three working days later;
  3. HR — two to three working days after that.
  Slots are Tuesday–Thursday, 9–11 am in the recipient's time zone, stated as a concrete date
  and time. Ahmed clicks Schedule send himself; never script, cron, or otherwise automate a send.
- **Make the three emails differ** — different ask (see Message rules), a differently worded
  opening and firm-specific sentence — so colleagues comparing notes don't see copies.
- **Small-firm exception:** under about 30 staff, contact two people, not three; skip HR unless
  that person actually recruits.
- If the first person replies before the later slots, tell Ahmed so he can mention that
  conversation in the remaining emails or cancel them.
- One short nudge after about a week, a second about a week later, then stop.
- After three people at one firm with no reply, drop the firm for now.
- Prefer LinkedIn over email when the address is inferred; if emailing, a wrong guess usually
  bounces within minutes.

## Guardrails

- Never send anything — drafts and compose windows only.
- Never fabricate a name, title, profile URL, or email address. An inferred address is always
  labelled as inferred.
- Message content is reworded from real Profile Bank / resume material only — no invented claims,
  metrics, or enthusiasm Ahmed hasn't expressed. Respect the Willett confidentiality note in the
  bank (no schema, entity, fund, or AUM details).
- CRM writes (`recruiting_contacts`, `recruiting_interactions`) only on Ahmed's explicit yes; only
  `recruiting_`-prefixed tables; never delete rows.
