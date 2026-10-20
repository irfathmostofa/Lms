import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { AssessmentForm } from '@/components/dashboard/assessment-form';
import { DeleteAssessmentButton } from '@/components/dashboard/delete-assessment-button';
import { ButtonLink, Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
import { assessmentTypeConfig } from '@/lib/assessments';
import { quizQuestionFromRow } from '@/lib/quiz';
import type { Assessment, QuizQuestion } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditAssessmentPage({ params }: { params: { id: string } }) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [assessmentRes, coursesRes, batchesRes, questionsRes] = await Promise.all([
    supabase.from('assessments').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('courses').select('id, title').order('title'),
    supabase.from('batches').select('id, name, course_id').order('name'),
    supabase.from('quiz_questions').select('*').eq('assessment_id', params.id).order('sort_order'),
  ]);

  const assessment = assessmentRes.data as Assessment | null;
  if (!assessment) notFound();

  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];
  const batches = (batchesRes.data as { id: string; name: string; course_id: string | null }[]) ?? [];
  const questions: QuizQuestion[] = (questionsRes.data ?? []).map((row, index) =>
    quizQuestionFromRow(row, index),
  );
  const config = assessmentTypeConfig(assessment.type);

  return (
    <>
      <PageHeader
        title={`Edit ${config.label.toLowerCase()}`}
        description={assessment.title}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href={`/dashboard/assessments/${assessment.id}`} size="sm" variant="outline">
              Marks
            </ButtonLink>
            <ButtonLink href="/dashboard/assessments" size="sm" variant="secondary">
              All assessments
            </ButtonLink>
            <DeleteAssessmentButton id={assessment.id} />
          </div>
        }
      />

      <Card>
        <CardHeader title="Assessment details" description="Changes apply immediately after save." />
        <CardBody>
          {assessmentRes.error || coursesRes.error || batchesRes.error || questionsRes.error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {assessmentRes.error?.message ??
                coursesRes.error?.message ??
                batchesRes.error?.message ??
                questionsRes.error?.message}
            </p>
          ) : null}
          <AssessmentForm courses={courses} batches={batches} assessment={assessment} questions={questions} />
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
