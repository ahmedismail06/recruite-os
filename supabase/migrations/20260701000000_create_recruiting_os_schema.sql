-- Recruiting OS schema. All objects are prefixed `recruiting_` so they can
-- never collide with recipe-app tables sharing this project.
-- Access is pinned to Ahmed's auth user; other users in the shared
-- auth.users (recipe-app users) get no access.
-- Applied to project dlyombtgtgsavtiqohve on 2026-07-01 via Supabase MCP.

create or replace function public.recruiting_owner()
returns uuid
language sql
stable
set search_path = ''
as $$
  select 'a208e139-3cf1-40ed-aab5-417dc479c585'::uuid
$$;

create or replace function public.recruiting_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Profile Bank ────────────────────────────────────────────────

create table public.recruiting_profile_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  problem text,
  approach text,
  impact text,
  tech_stack text[] not null default '{}',
  tags text[] not null default '{}',
  repo_url text,
  bullet_short text,
  bullet_medium text,
  bullet_detailed text,
  date_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiting_profile_experience (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  org text not null,
  date_range text,
  problem text,
  approach text,
  impact text,
  tech_stack text[] not null default '{}',
  tags text[] not null default '{}',
  bullet_short text,
  bullet_medium text,
  bullet_detailed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiting_profile_skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('language','framework','tool','coursework','cert')),
  source text,
  created_at timestamptz not null default now()
);

-- ── CRM ─────────────────────────────────────────────────────────

create table public.recruiting_roles (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  jd_text text,
  source text not null default 'manual' check (source in ('manual','ai-suggested')),
  status text not null default 'interested' check (status in ('interested','applied','screening','interviewing','offer','rejected','ghosted')),
  fit_rationale text,
  date_added timestamptz not null default now(),
  date_applied timestamptz
);

create table public.recruiting_applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.recruiting_roles(id) on delete cascade,
  stage text not null default 'applied',
  next_action text,
  next_action_due date,
  tailored_resume_path text,
  resume_version int not null default 0,
  follow_up_due_days int not null default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiting_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  role_id uuid references public.recruiting_roles(id) on delete set null,
  email text,
  last_touch_date date,
  last_touch_direction text check (last_touch_direction in ('sent','received')),
  follow_up_due_days int not null default 7,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiting_interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.recruiting_contacts(id) on delete set null,
  application_id uuid references public.recruiting_applications(id) on delete set null,
  type text not null default 'email' check (type in ('email','call','coffee chat','other')),
  summary text,
  date timestamptz not null default now(),
  gmail_thread_id text,
  created_at timestamptz not null default now()
);

create index recruiting_applications_role_id_idx on public.recruiting_applications(role_id);
create index recruiting_contacts_role_id_idx on public.recruiting_contacts(role_id);
create index recruiting_interactions_contact_id_idx on public.recruiting_interactions(contact_id);
create index recruiting_interactions_application_id_idx on public.recruiting_interactions(application_id);
create index recruiting_interactions_gmail_thread_id_idx on public.recruiting_interactions(gmail_thread_id);

create trigger recruiting_set_updated_at before update on public.recruiting_profile_projects
  for each row execute function public.recruiting_set_updated_at();
create trigger recruiting_set_updated_at before update on public.recruiting_profile_experience
  for each row execute function public.recruiting_set_updated_at();
create trigger recruiting_set_updated_at before update on public.recruiting_applications
  for each row execute function public.recruiting_set_updated_at();
create trigger recruiting_set_updated_at before update on public.recruiting_contacts
  for each row execute function public.recruiting_set_updated_at();

-- ── RLS: owner-only, pinned to Ahmed's user id ──────────────────

alter table public.recruiting_profile_projects enable row level security;
alter table public.recruiting_profile_experience enable row level security;
alter table public.recruiting_profile_skills enable row level security;
alter table public.recruiting_roles enable row level security;
alter table public.recruiting_applications enable row level security;
alter table public.recruiting_contacts enable row level security;
alter table public.recruiting_interactions enable row level security;

create policy "recruiting owner full access" on public.recruiting_profile_projects
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_profile_experience
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_profile_skills
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_roles
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_applications
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_contacts
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_interactions
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
