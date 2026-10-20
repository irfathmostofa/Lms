-- Allow instructors and admins to assign assessments to a course or a batch.
-- The previous policy only allowed editors, or instructors assigned to a course,
-- which blocked batch-only class tests and exam assignment.

drop policy if exists assessments_write on public.assessments;
create policy assessments_write on public.assessments
  for all using (
    (select public.is_editor())
    or (select public.is_instructor())
  ) with check (
    (select public.is_editor())
    or (select public.is_instructor())
  );
