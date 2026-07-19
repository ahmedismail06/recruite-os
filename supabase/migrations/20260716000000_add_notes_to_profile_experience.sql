-- Long-form, non-resume context for an experience: pitch, domain framing,
-- interview war stories, architecture notes. Read by resume-tailor and
-- cover-letter as source material; never copied verbatim into a resume.

alter table public.recruiting_profile_experience
  add column if not exists notes text;

comment on column public.recruiting_profile_experience.notes is
  'Markdown. Interview-prep and drafting context that does not belong in a bullet variant.';
