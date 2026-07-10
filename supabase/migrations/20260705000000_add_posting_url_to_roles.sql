-- Link to the original job posting so the webapp can open it directly.
alter table public.recruiting_roles
  add column if not exists posting_url text;
