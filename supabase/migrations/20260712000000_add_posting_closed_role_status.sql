-- Adds a 'posting_closed' status for roles where the posting itself is gone —
-- taken down, no longer accepting applications, or the link/listing can't be
-- found anymore. Distinct from 'rejected' (company responded no), 'ghosted'
-- (no response), and 'not_interested' (the owner passed on it themselves): here
-- nobody made a decision about the owner, the opportunity just stopped existing.
alter table public.recruiting_roles
  drop constraint recruiting_roles_status_check;

alter table public.recruiting_roles
  add constraint recruiting_roles_status_check
  check (status in ('interested','applied','screening','interviewing','offer','rejected','ghosted','not_interested','posting_closed'));
