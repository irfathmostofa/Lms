'use client';

import { AssessmentForm } from '@/components/dashboard/assessment-form';

export function AssessmentCreateForm({
  courses,
  batches,
}: {
  courses: { id: string; title: string }[];
  batches: { id: string; name: string; course_id: string | null }[];
}) {
  return <AssessmentForm courses={courses} batches={batches} />;
}
