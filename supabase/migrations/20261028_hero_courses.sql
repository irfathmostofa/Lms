alter table public.hero_slides
  add column if not exists course_id uuid references public.courses(id) on delete set null;

alter table public.hero_slides
  add column if not exists particle_style text not null default 'orbs';

alter table public.hero_slides
  alter column image_url drop not null;

create index if not exists hero_slides_course_idx on public.hero_slides(course_id);

alter table public.hero_slides
  drop constraint if exists hero_slides_has_visual;

alter table public.hero_slides
  add constraint hero_slides_has_visual
  check (image_url is not null or course_id is not null);
