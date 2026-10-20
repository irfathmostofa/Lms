import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { AssessmentCreateForm } from '@/components/dashboard/assessment-create-form';
import { DeleteAssessmentButton } from '@/components/dashboard/delete-assessment-button';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { FormModal } from '@/components/dashboard/form-modal';
import { assessmentTypeConfig } from '@/lib/assessments';
import { formatDateTime } from '@/lib/utils';
import type { Assessment } from '@/lib/types';

export const dynamic = 'force-dynamic';

const typeTone: Record<string, 'blue' | 'violet' | 'amber' | 'green' | 'slate'> = {
  homework: 'blue',
  class_test: 'violet',
  assignment: 'amber',
  exam: 'green',
  quiz: 'slate',
};

export default async function AssessmentsPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [assessmentsRes, coursesRes, batchesRes] = await Promise.all([
    supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('courses').select('id, title').order('title'),
    supabase.from('batches').select('id, name, course_id').order('name'),
  ]);

  const fetchError = assessmentsRes.error?.message ?? coursesRes.error?.message ?? batchesRes.error?.message;
  const assessments = (assessmentsRes.data as Assessment[]) ?? [];
  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];
  const batches = (batchesRes.data as { id: string; name: string; course_id: string | null }[]) ?? [];

  const courseName = new Map(courses.map((course) => [course.id, course.title]));
  const batchName = new Map(batches.map((batch) => [batch.id, batch.name]));

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Assign homework, class tests, assignments, exams and quizzes to a course or batch."
        action={
          <FormModal
            title="Create assessment"
            description="The form changes with the type you choose."
            triggerLabel="Create assessment"
            size="xl"
          >
            <AssessmentCreateForm courses={courses} batches={batches} />
          </FormModal>
        }
      />

      {fetchError ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Assessments could not be loaded: {fetchError}
        </p>
      ) : null}

      <Card>
        <CardHeader title="All assessments" description={`${assessments.length} items`} />
        <CardBody className="p-0">
          {assessments.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No assessments yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Mode</Th>
                  <Th>Assigned to</Th>
                  <Th>Marks</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((assessment) => {
                  const config = assessmentTypeConfig(assessment.type);
                  const targets = [
                    assessment.course_id ? courseName.get(assessment.course_id) ?? 'Course' : null,
                    assessment.batch_id ? batchName.get(assessment.batch_id) ?? 'Batch' : null,
                  ].filter(Boolean);
                  return (
                    <tr key={assessment.id}>
                      <Td className="font-medium text-slate-900">{assessment.title}</Td>
                      <Td>
                        <Badge tone={typeTone[assessment.type] ?? 'slate'}>{config.label}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={assessment.delivery_mode === 'offline' ? 'amber' : 'blue'}>
                          {assessment.delivery_mode === 'offline' ? 'offline' : 'online'}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-slate-500">{targets.join(' / ') || '-'}</Td>
                      <Td>
                        {assessment.type === 'homework'
                          ? 'Submitted / not'
                          : assessment.type === 'quiz' && assessment.time_limit_minutes
                            ? `${assessment.total_marks} · ${assessment.time_limit_minutes}m`
                            : assessment.total_marks}
                      </Td>
                      <Td className="text-xs text-slate-500">{formatDateTime(assessment.due_at)}</Td>
                      <Td>
                        <Badge tone={assessment.is_published ? 'green' : 'amber'}>
                          {assessment.is_published ? 'published' : 'draft'}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/dashboard/assessments/${assessment.id}`}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            {assessment.type === 'homework'
                              ? 'Submissions'
                              : assessment.type === 'quiz'
                                ? 'Remarks'
                                : 'Marks'}
                          </Link>
                          <Link
                            href={`/dashboard/assessments/${assessment.id}/edit`}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteAssessmentButton id={assessment.id} />
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
