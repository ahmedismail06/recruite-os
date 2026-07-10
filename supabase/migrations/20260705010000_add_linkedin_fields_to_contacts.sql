-- Lets recruiter-finder store a profile link, title, and a drafted
-- (never auto-sent) outreach message alongside a contact.
alter table public.recruiting_contacts
  add column if not exists linkedin_url text,
  add column if not exists title text,
  add column if not exists draft_message text;
