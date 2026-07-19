# data/ — local storage backend

When Recruiting OS is configured with `"storage": "local"` in `recruiting-os.config.json`, this is
where all your data lives — plain markdown files, no database, no account. Everything here **except
this README is git-ignored**, so your personal recruiting data never gets committed.

The skills create and maintain these files for you; you don't have to write them by hand. The
authoritative schema (front-matter fields + body sections for each file) is in `STORAGE.md` at the
repo root.

Layout:

```
data/
  profile/
    projects/<title-slug>.md        # one file per Profile Bank project
    experience/<org>-<role-slug>.md  # one file per experience
    skills.md                        # a table of skills / coursework / certs
  crm/
    roles/<company>-<title-slug>.md  # one file per role (application embedded)
    contacts/<name-slug>.md          # one file per contact
    interactions/<date>-<slug>.md    # one file per logged interaction
  watchlist/
    tracked-companies.md             # ats-scan watchlist (a table)
    seen-postings.md                 # ats-scan dedup cache (a table)
```

Run `/setup` if you haven't configured a backend yet. To switch to Supabase later (which also
unlocks the webapp), re-run `/setup`.
