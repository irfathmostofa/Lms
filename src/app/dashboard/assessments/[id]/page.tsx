import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { MarksSheet, type MarksStudent } from '@/components/dashboard/marks-sheet';
import { DeleteAssessmentButton } from '@/components/dashboard/delete-assessment-button';
import {
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from '@/components/ui';
import { assessmentTypeConfig } from '@/lib/assessments';
import { formatDateTime } from '@/lib/utils';
import type { Assessment } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface EnrollmentRow {
  student_id: string;
  course_id: string;
  batch_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface SubmissionRow {
  student_id: string;
  content: string | null;
  file_url: string | null;
  status: string | null;
  marks: number | null;
  feedback: string | null;
  submitted_at: string | null;
}

function assignedEnrollmentFilter(assessment: Assessment) {
  if (assessment.course_id && assessment.batch_id) {
    return `course_id.eq.${assessment.course_id},batch_id.eq.${assessment.batch_id}`;
  }
  return null;
}

export default async function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (!assessment) notFound();

  let enrollmentsQuery = supabase
    .from('enrollments')
    .select('student_id, course_id, batch_id, profiles!enrollments_student_id_fkey(full_name, email)')
    .in('status', ['pending', 'active', 'completed']);

  const orFilter = assignedEnrollmentFilter(assessment);
  if (orFilter) {
    enrollmentsQuery = enrollmentsQuery.or(orFilter);
  } else if (assessment.course_id) {
    enrollmentsQuery = enrollmentsQuery.eq('course_id', assessment.course_id);
  } else if (assessment.batch_id) {
    enrollmentsQuery = enrollmentsQuery.eq('batch_id', assessment.batch_id);
  } else {
    enrollmentsQuery = enrollmentsQuery.eq('student_id', '00000000-0000-0000-0000-000000000000');
  }

  const [enrollmentsRes, submissionsRes] = await Promise.all([
    enrollmentsQuery,
    supabase
      .from('submissions')
      .select('student_id, content, file_url, status, marks, feedback, submitted_at')
      .eq('assessment_id', params.id),
  ]);

  const enrollments = (enrollmentsRes.data as unknown as EnrollmentRow[]) ?? [];
  const submissions = (submissionsRes.data as SubmissionRow[]) ?? [];
  const submissionByStudent = new Map(submissions.map((row) => [row.student_id, row]));
  const seen = new Set<string>();
  const students: MarksStudent[] = [];

  for (const enrollment of enrollments) {
    if (seen.has(enrollment.student_id)) continue;
    seen.add(enrollment.student_id);
    const submission = submissionByStudent.get(enrollment.student_id);
    students.push({
      studentId: enrollment.student_id,
      name: enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? 'Student',
      email: enrollment.profiles?.email ?? null,
      content: submission?.content ?? null,
      fileUrl: submission?.file_url ?? null,
      submittedAt: submission?.submitted_at ?? null,
      status: submission?.status ?? null,
      marks: submission?.marks ?? null,
      feedback: submission?.feedback ?? null,
    });
  }

  for (const submission of submissions) {
    if (seen.has(submission.student_id)) continue;
    seen.add(submission.student_id);
    students.push({
      studentId: submission.student_id,
      name: 'Student',
      email: null,
      content: submission.content,
      fileUrl: submission.file_url,
      submittedAt: submission.submitted_at,
      status: submission.status,
      marks: submission.marks,
      feedback: submission.feedback,
    });
  }

  students.sort((a, b) => a.name.localeCompare(b.name));
  const config = assessmentTypeConfig(assessment.type);
  const fetchError = enrollmentsRes.error?.message ?? submissionsRes.error?.message;

  return (
    <>
      <PageHeader
        title={assessment.title}
        description={`${config.label} · ${assessment.delivery_mode === 'offline' ? 'offline' : 'online'}${
          assessment.type === 'homework'
            ? ' · submitted / not submitted'
            : ` · out of ${assessment.total_marks} marks`
        }${
          assessment.type === 'quiz' && assessment.time_limit_minutes
            ? ` · ${assessment.time_limit_minutes} min timer`
            : ''
        } · due ${formatDateTime(assessment.due_at)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href={`/dashboard/assessments/${assessment.id}/edit`} size="sm" variant="outline">
              Edit
            </ButtonLink>
            <ButtonLink href="/dashboard/assessments" size="sm" variant="secondary">
              All assessments
            </ButtonLink>
            <DeleteAssessmentButton id={assessment.id} />
          </div>
        }
      />

      {fetchError ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Marks could not be loaded: {fetchError}
        </p>
      ) : null}

      <Card>
        <CardHeader
          title={
            assessment.type === 'homework'
              ? 'Submission sheet'
              : assessment.type === 'quiz'
                ? 'Quiz remarks'
                : 'Marks sheet'
          }
          description={
            assessment.type === 'homework'
              ? `${students.length} assigned students. Track submitted or not submitted.`
              : assessment.type === 'quiz'
                ? `${students.length} assigned students. Scores come from the attempt; add remarks only.`
                : `${students.length} assigned students. Enter marks and remarks, then save all at once.`
          }
        />
        <CardBody className="p-0">
          {students.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No assigned students"
                description="Enroll students in the course or batch this assessment is assigned to."
              />
            </div>
          ) : (
            <MarksSheet
              assessmentId={params.id}
              assessmentType={assessment.type}
              totalMarks={Number(assessment.total_marks) || 0}
              students={students}
            />
          )}
        </CardBody>
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        <Link href="/dashboard/assessments" className="font-medium text-brand-600 hover:underline">
          Back to assessments
        </Link>
      </p>
    </>
  );
}
