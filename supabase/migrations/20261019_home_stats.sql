create or replace function public.get_home_stats()
returns table (courses bigint, lessons bigint, students bigint, resources bigint, categories bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.courses
      where status = 'published' and visibility <> 'private'),
    (select count(*) from public.lessons l
      join public.courses c on c.id = l.course_id
      where c.status = 'published' and c.visibility <> 'private'),
    (select count(*) from public.profiles where role = 'student' and is_active),
    (select count(*) from public.products where is_active),
    (select count(*) from public.categories where is_active);
$$;

grant execute on function public.get_home_stats() to anon, authenticated;
