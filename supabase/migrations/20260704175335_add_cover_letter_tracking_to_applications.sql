alter table public.recruiting_applications
  add column tailored_cover_letter_path text,
  add column cover_letter_version int not null default 0;
