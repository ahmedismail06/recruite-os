-- The recruiting webapp has no login (removed 2026-07-01) and its secret
-- (service-role) key isn't retrievable through the tooling in use, so it
-- runs server-side with the publishable/anon key instead. The anon role
-- carries no session, so it can't satisfy the existing owner-scoped
-- "auth.uid() = recruiting_owner()" policies at all — grant it unconditional
-- access to the same recruiting_* tables instead. This key is never sent to
-- the browser (server-side only, .env.local is git-ignored), so exposure is
-- limited to whoever already has repo/server access.

create policy "recruiting anon local access" on public.recruiting_profile_projects
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_profile_experience
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_profile_skills
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_roles
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_applications
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_contacts
  for all to anon
  using (true)
  with check (true);
create policy "recruiting anon local access" on public.recruiting_interactions
  for all to anon
  using (true)
  with check (true);
