alter table public.assessments
  add column if not exists time_limit_minutes int;

alter table public.assessments
  drop constraint if exists assessments_time_limit_minutes_check;

alter table public.assessments
  add constraint assessments_time_limit_minutes_check
  check (time_limit_minutes is null or time_limit_minutes > 0);
