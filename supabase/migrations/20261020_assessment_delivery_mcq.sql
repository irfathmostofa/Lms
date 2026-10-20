-- Instructor-chosen online/offline delivery, plus traditional MCQ questions.

do $$
begin
  create type public.assessment_delivery as enum ('online','offline');
exception
  when duplicate_object then null;
end $$;

alter table public.assessments
  add column if not exists delivery_mode public.assessment_delivery not null default 'online';

create table if not exists public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   uuid not null references public.assessments(id) on delete cascade,
  prompt          text not null,
  option_a        text not null,
  option_b        text not null,
  option_c        text,
  option_d        text,
  option_e        text,
  correct_option  text not null check (correct_option in ('A','B','C','D','E')),
  marks           numeric(6,2) not null default 1,
  sort_order      int not null default 0,
  explanation     text,
  created_at      timestamptz not null default now()
);

create index if not exists quiz_questions_assessment_idx on public.quiz_questions(assessment_id, sort_order);

alter table public.quiz_questions enable row level security;

drop policy if exists quiz_questions_staff on public.quiz_questions;
create policy quiz_questions_staff on public.quiz_questions
  for all using ((select public.is_staff()))
  with check ((select public.is_instructor()) or (select public.is_editor()));

grant select, insert, update, delete on public.quiz_questions to authenticated;
grant select, insert, update, delete on public.quiz_questions to service_role;

-- Students never read correct answers directly.
create or replace function public.get_quiz_paper(p_assessment uuid)
returns table (
  id uuid,
  prompt text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  option_e text,
  marks numeric,
  sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.prompt,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.option_e,
    q.marks,
    q.sort_order
  from public.quiz_questions q
  join public.assessments a on a.id = q.assessment_id
  where q.assessment_id = p_assessment
    and a.type = 'quiz'
    and a.delivery_mode = 'online'
    and a.is_published = true
    and (
      (select public.is_staff())
      or (a.course_id is not null and (select public.is_enrolled(a.course_id)))
      or (a.batch_id is not null and exists (
            select 1 from public.enrollments e
            where e.batch_id = a.batch_id and e.student_id = auth.uid()
          ))
    )
  order by q.sort_order, q.created_at;
$$;

grant execute on function public.get_quiz_paper(uuid) to authenticated;

create or replace function public.grade_quiz_submission(p_assessment uuid, p_answers jsonb)
returns table (marks numeric, total numeric, feedback text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total numeric := 0;
  v_score numeric := 0;
  v_question record;
  v_picked text;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  if not exists (
    select 1 from public.assessments a
    where a.id = p_assessment
      and a.type = 'quiz'
      and a.delivery_mode = 'online'
      and a.is_published = true
      and (
        (a.course_id is not null and public.is_enrolled(a.course_id))
        or (a.batch_id is not null and exists (
              select 1 from public.enrollments e
              where e.batch_id = a.batch_id and e.student_id = v_user
            ))
      )
  ) then
    raise exception 'Quiz is not available';
  end if;

  for v_question in
    select id, correct_option, marks
    from public.quiz_questions
    where assessment_id = p_assessment
  loop
    v_total := v_total + v_question.marks;
    v_picked := upper(coalesce(p_answers ->> v_question.id::text, ''));
    if v_picked = v_question.correct_option then
      v_score := v_score + v_question.marks;
    end if;
  end loop;

  insert into public.submissions (
    assessment_id, student_id, content, status, marks, feedback, submitted_at, graded_at
  ) values (
    p_assessment,
    v_user,
    p_answers::text,
    'graded',
    v_score,
    'Auto-graded MCQ: ' || v_score::text || ' / ' || v_total::text,
    now(),
    now()
  )
  on conflict (assessment_id, student_id) do update
    set content = excluded.content,
        status = 'graded',
        marks = excluded.marks,
        feedback = excluded.feedback,
        submitted_at = excluded.submitted_at,
        graded_at = excluded.graded_at;

  return query select v_score, v_total, ('Auto-graded MCQ: ' || v_score::text || ' / ' || v_total::text);
end $$;

grant execute on function public.grade_quiz_submission(uuid, jsonb) to authenticated;
