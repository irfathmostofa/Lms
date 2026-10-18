-- Course setup: 3-step builder (basic, curriculum, additional).
-- Safe to run on an existing database created from an earlier schema.sql.

-- pgcrypto lives in the extensions schema on Supabase, so qualify the
-- search_path of the password helpers below. This is a no-op when already
-- installed (the default on Supabase).
create extension if not exists pgcrypto;

do $$
begin
  create type public.course_visibility as enum ('public','password','private');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.assessment_type add value if not exists 'quiz';
exception
  when undefined_object then null;
end $$;

alter table public.courses
  add column if not exists visibility public.course_visibility not null default 'public',
  add column if not exists scheduled_at timestamptz,
  add column if not exists author_id uuid references public.profiles(id) on delete set null,
  add column if not exists author_name text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists duration_label text,
  add column if not exists learning_outcomes text,
  add column if not exists target_audience text,
  add column if not exists materials_included text,
  add column if not exists requirements text;

create index if not exists courses_author_idx on public.courses(author_id);
create index if not exists courses_visibility_idx on public.courses(visibility);
create index if not exists courses_tags_idx on public.courses using gin(tags);

alter table public.assessments
  add column if not exists section_id uuid references public.course_sections(id) on delete cascade,
  add column if not exists sort_order int not null default 0;

create index if not exists assessments_section_idx on public.assessments(section_id);

create table if not exists public.course_access (
  course_id     uuid primary key references public.courses(id) on delete cascade,
  password_hash text not null,
  updated_at    timestamptz not null default now()
);

alter table public.course_access enable row level security;

drop policy if exists course_access_editor on public.course_access;
create policy course_access_editor on public.course_access
  for all using ((select public.is_editor())) with check ((select public.is_editor()));

drop policy if exists courses_select_published on public.courses;
create policy courses_select_published on public.courses
  for select using (
    (status = 'published' and visibility <> 'private')
    or (select public.is_editor())
    or (select public.is_instructor_of(id))
    or (select public.is_enrolled(id))
  );

drop policy if exists assessments_write on public.assessments;
create policy assessments_write on public.assessments
  for all using (
    (select public.is_editor())
    or (course_id is not null and (select public.is_instructor_of(course_id)))
  ) with check (
    (select public.is_editor())
    or (course_id is not null and (select public.is_instructor_of(course_id)))
  );

drop policy if exists sections_read on public.course_sections;
create policy sections_read on public.course_sections
  for select using (
    (select public.is_course_published(course_id))
    or (select public.is_staff())
    or (select public.is_instructor_of(course_id))
    or (select public.is_enrolled(course_id))
  );

create or replace function public.is_course_published(p_course uuid)
returns boolean
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course and c.status = 'published' and c.visibility <> 'private'
  );
$$ language sql stable security definer set search_path = public;

create or replace view public.public_lesson_outline as
select
  l.id, l.section_id, l.course_id, l.title, l.type, l.duration_min,
  l.sort_order, l.is_preview
from public.lessons l
join public.courses c on c.id = l.course_id
where c.status = 'published' and c.visibility <> 'private';

create or replace function public.set_course_password(p_course uuid, p_password text)
returns void
as $$
begin
  if not public.is_editor() then
    raise exception 'Not allowed';
  end if;

  if p_password is null or length(trim(p_password)) = 0 then
    delete from public.course_access where course_id = p_course;
  else
    insert into public.course_access (course_id, password_hash)
    values (p_course, crypt(p_password, gen_salt('bf')))
    on conflict (course_id) do update
      set password_hash = excluded.password_hash, updated_at = now();
  end if;
end $$ language plpgsql security definer set search_path = public, extensions;

create or replace function public.verify_course_password(p_course uuid, p_password text)
returns boolean
as $$
  select exists (
    select 1 from public.course_access
    where course_id = p_course
      and password_hash = crypt(p_password, password_hash)
  );
$$ language sql stable security definer set search_path = public, extensions;

grant execute on function public.verify_course_password(uuid, text) to anon, authenticated;

create or replace function public.sync_course_lesson_count()
returns trigger
as $$
declare
  v_course uuid;
begin
  if tg_op = 'UPDATE' and old.course_id is distinct from new.course_id then
    update public.courses c
      set total_lessons = (select count(*) from public.lessons l where l.course_id = old.course_id)
      where c.id = old.course_id;
  end if;

  v_course := coalesce(new.course_id, old.course_id);
  update public.courses c
    set total_lessons = (select count(*) from public.lessons l where l.course_id = v_course)
    where c.id = v_course;

  return coalesce(new, old);
end $$ language plpgsql security definer set search_path = public;

drop trigger if exists lessons_sync_count on public.lessons;
create trigger lessons_sync_count
  after insert or update of course_id or delete on public.lessons
  for each row execute function public.sync_course_lesson_count();
