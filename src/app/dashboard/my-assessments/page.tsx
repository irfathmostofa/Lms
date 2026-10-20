import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/ui';
import { SubmissionForm } from '@/components/dashboard/submission-form';
import { assessmentTypeConfig, resolveDelivery } from '@/lib/assessments';
import { formatDateTime } from '@/lib/utils';
import type { Assessment, QuizPaperQuestion } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface SubmissionRow {
  assessment_id: string;
  content: string | null;
  file_url: string | null;
  status: string;
  marks: number | null;
  feedback: string | null;
}

const typeTone: Record<string, 'blue' | 'violet' | 'amber' | 'green' | 'slate'> = {
  homework: 'blue',
  class_test: 'violet',
  assignment: 'amber',
  exam: 'green',
  quiz: 'slate',
};

export default async function MyAssessmentsPage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [assessmentsRes, submissionsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('assessments')
      .select('*')
      .eq('is_published', true)
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(100),
    supabase
      .from('submissions')
      .select('assessment_id, content, file_url, status, marks, feedback')
      .eq('student_id', ctx.userId),
    supabase
      .from('enrollments')
      .select('course_id, batch_id, status')
      .eq('student_id', ctx.userId)
      .eq('status', 'active'),
  ]);

  const fetchError =
    assessmentsRes.error?.message ?? submissionsRes.error?.message ?? enrollmentsRes.error?.message;
  const assessments = (assessmentsRes.data as Assessment[]) ?? [];
  const submissions = (submissionsRes.data as SubmissionRow[]) ?? [];
  const enrollments = (enrollmentsRes.data as { course_id: string; batch_id: string | null }[]) ?? [];

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
  const enrolledBatchIds = new Set(enrollments.map((e) => e.batch_id).filter(Boolean) as string[]);

  const relevant = assessments.filter((assessment) => {
    const courseMatch = assessment.course_id ? enrolledCourseIds.has(assessment.course_id) : false;
    const batchMatch = assessment.batch_id ? enrolledBatchIds.has(assessment.batch_id) : false;
    if (assessment.course_id && assessment.batch_id) return courseMatch || batchMatch;
    if (assessment.course_id) return courseMatch;
    if (assessment.batch_id) return batchMatch;
    return false;
  });

  const submissionByAssessment = new Map(submissions.map((s) => [s.assessment_id, s]));
  const graded = submissions.filter((s) => s.status === 'graded').length;

  const onlineQuizIds = relevant
    .filter((assessment) => assessment.type === 'quiz' && resolveDelivery(assessment.type, assessment.delivery_mode) === 'online')
    .map((assessment) => assessment.id);

  const quizPapers = await Promise.all(
    onlineQuizIds.map(async (id) => {
      const { data } = await supabase.rpc('get_quiz_paper', { p_assessment: id });
      return [id, (data as QuizPaperQuestion[]) ?? []] as const;
    }),
  );
  const questionsByAssessment = new Map(quizPapers);

  return (
    <>
      <PageHeader title="Assessments" description="Homework, class tests, assignments and exams." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={relevant.length} />
        <StatCard label="Submitted" value={submissions.length} />
        <StatCard label="Graded" value={graded} />
      </div>

      {fetchError ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Assessments could not be loaded: {fetchError}
        </p>
      ) : null}

      {relevant.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          description="Assessments appear here when your instructor publishes them for your course or batch."
        />
      ) : (
        <div className="space-y-4">
          {relevant.map((assessment) => {
            const submission = submissionByAssessment.get(assessment.id);
            const isGraded = submission?.status === 'graded';
            const config = assessmentTypeConfig(assessment.type);
            return (
              <Card key={assessment.id}>
                <CardHeader
                  title={assessment.title}
                  description={assessment.instructions ?? undefined}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone={typeTone[assessment.type] ?? 'slate'}>
                        {config.label}
                      </Badge>
                      <Badge tone={resolveDelivery(assessment.type, assessment.delivery_mode) === 'offline' ? 'amber' : 'blue'}>
                        {resolveDelivery(assessment.type, assessment.delivery_mode)}
                      </Badge>
                      {submission ? (
                        <Badge tone={isGraded ? 'green' : 'amber'}>
                          {isGraded ? 'graded' : 'submitted'}
                        </Badge>
                      ) : null}
                    </div>
                  }
                />
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Total marks: {assessment.total_marks}</span>
                    {assessment.pass_marks ? <span>Pass: {assessment.pass_marks}</span> : null}
                    <span>Due: {formatDateTime(assessment.due_at)}</span>
                  </div>

                  {isGraded ? (
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">
                        Marks: {submission?.marks ?? 0} / {assessment.total_marks}
                      </p>
                      {submission?.feedback ? (
                        <p className="mt-1 text-sm text-emerald-700">{submission.feedback}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <SubmissionForm
                    assessmentId={assessment.id}
                    type={assessment.type}
                    deliveryMode={assessment.delivery_mode}
                    questions={questionsByAssessment.get(assessment.id) ?? []}
                    existingContent={submission?.content}
                    existingFileUrl={submission?.file_url}
                    readOnly={isGraded}
                  />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
