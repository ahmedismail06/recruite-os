-- Adds ATS-scan infrastructure: a maintained watchlist of companies to poll
-- via their public Greenhouse/Lever/Ashby job-board APIs, and a dedup cache
-- of every posting ever seen so re-scans only surface genuinely new ones.
-- Complementary to recruiting_roles.not_yet_posted (role-scout's thesis-based
-- web search), not a replacement for it — see the ats-scan skill.

create table public.recruiting_tracked_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  ats_platform text not null check (ats_platform in ('greenhouse','lever','ashby')),
  ats_slug text not null,
  active boolean not null default true,
  notes text,
  added_date timestamptz not null default now(),
  last_scanned_at timestamptz,
  unique (company_name, ats_platform)
);

create table public.recruiting_seen_postings (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  posting_url text not null unique,
  ats_platform text not null check (ats_platform in ('greenhouse','lever','ashby')),
  jd_text text,
  matched_role_id uuid references public.recruiting_roles(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index recruiting_tracked_companies_active_idx on public.recruiting_tracked_companies(active);
create index recruiting_seen_postings_matched_role_id_idx on public.recruiting_seen_postings(matched_role_id);

-- ── RLS: same owner-only + anon-webapp pattern as the rest of the schema ──

alter table public.recruiting_tracked_companies enable row level security;
alter table public.recruiting_seen_postings enable row level security;

create policy "recruiting owner full access" on public.recruiting_tracked_companies
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());
create policy "recruiting owner full access" on public.recruiting_seen_postings
  for all to authenticated
  using ((select auth.uid()) = public.recruiting_owner())
  with check ((select auth.uid()) = public.recruiting_owner());

create policy "recruiting anon local access" on public.recruiting_tracked_companies
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_seen_postings
  for all to anon
  using (true)
  with check (true);
