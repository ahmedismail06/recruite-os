-- Tracks recurring-program roles sourced by role-scout before a live posting exists,
-- so role-scout can recheck them on each run without conflating this with the
-- recruiting_roles.status pipeline stage (interested/applied/.../ghosted).
alter table public.recruiting_roles
  add column not_yet_posted boolean not null default false,
  add column last_checked_at timestamptz;

comment on column public.recruiting_roles.not_yet_posted is
  'True when sourced from a recurring program/company that has not opened applications yet. role-scout rechecks these each run and flips to false once a live posting is found.';
comment on column public.recruiting_roles.last_checked_at is
  'Last time role-scout checked whether a not_yet_posted role has gone live.';
