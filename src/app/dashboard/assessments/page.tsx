import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createAssessmentAction } from '@/actions/dashboard';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
  Textarea,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { formatDateTime } from '@/lib/utils';
import type { Assessment } from '@/lib/types';

export const dynamic = 'force-dynamic';

const typeTone: Record<string, 'blue' | 'violet' | 'amber' | 'green'> = {
  homework: 'blue',
  class_test: 'violet',
  assignment: 'amber',
  exam: 'green',
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
    supabase.from('batches').select('id, name').order('name'),
  ]);

  const assessments = (assessmentsRes.data as Assessment[]) ?? [];
  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];
  const batches = (batchesRes.data as { id: string; name: string }[]) ?? [];

  const courseName = new Map(courses.map((course) => [course.id, course.title]));
  const batchName = new Map(batches.map((batch) => [batch.id, batch.name]));

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Homework, class tests, assignments and exams. Target a course or a batch."
      />

      <Card className="mb-6">
        <CardHeader title="Create assessment" description="Enrolled students see it once published." />
        <CardBody>
          <form action={createAssessmentAction} className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Title">
                <Input name="title" required />
              </Field>
            </div>
            <Field label="Type">
              <Select name="type" defaultValue="homework">
                <option value="homework">Homework</option>
                <option value="class_test">Class test</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
              </Select>
            </Field>
            <Field label="Course (optional)">
              <Select name="course_id" defaultValue="">
                <option value="">None</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Batch (optional)">
              <Select name="batch_id" defaultValue="">
                <option value="">None</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input name="due_at" type="datetime-local" />
            </Field>
            <Field label="Total marks">
              <Input name="total_marks" type="number" min="0" step="0.01" defaultValue="100" />
            </Field>
            <Field label="Pass marks">
              <Input name="pass_marks" type="number" min="0" step="0.01" />
            </Field>
            <Field label="Publish now">
              <Select name="is_published" defaultValue="off">
                <option value="off">Save as draft</option>
                <option value="on">Publish</option>
              </Select>
            </Field>
            <div className="sm:col-span-3">
              <Field label="Instructions">
                <Textarea name="instructions" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <SubmitButton pendingLabel="Creating...">Create assessment</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

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
                  <Th>Target</Th>
                  <Th>Marks</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <Td className="font-medium text-slate-900">{assessment.title}</Td>
                    <Td>
                      <Badge tone={typeTone[assessment.type] ?? 'slate'}>
                        {assessment.type.replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {assessment.course_id
                        ? courseName.get(assessment.course_id) ?? 'Course'
                        : batchName.get(assessment.batch_id ?? '') ?? 'Batch'}
                    </Td>
                    <Td>{assessment.total_marks}</Td>
                    <Td className="text-xs text-slate-500">{formatDateTime(assessment.due_at)}</Td>
                    <Td>
                      <Badge tone={assessment.is_published ? 'green' : 'amber'}>
                        {assessment.is_published ? 'published' : 'draft'}
                      </Badge>
                    </Td>
                    <Td>
                      <Link
                        href={`/dashboard/assessments/${assessment.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Submissions
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
