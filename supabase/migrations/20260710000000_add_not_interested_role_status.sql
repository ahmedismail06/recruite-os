-- Adds a 'not_interested' status for roles the owner decides to pass on themselves,
-- distinct from 'rejected' (company said no) and 'ghosted' (no response).
alter table public.recruiting_roles
  drop constraint recruiting_roles_status_check;

alter table public.recruiting_roles
  add constraint recruiting_roles_status_check
  check (status in ('interested','applied','screening','interviewing','offer','rejected','ghosted','not_interested'));
