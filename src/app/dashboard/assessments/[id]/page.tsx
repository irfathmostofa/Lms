import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { GradeForm } from '@/components/dashboard/grade-form';
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
import { assessmentTypeConfig } from '@/lib/assessments';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface SubmissionRow {
  id: string;
  content: string | null;
  file_url: string | null;
  status: string;
  marks: number | null;
  feedback: string | null;
  submitted_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
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

  const { data, error } = await supabase
    .from('submissions')
    .select('id, content, file_url, status, marks, feedback, submitted_at, profiles!submissions_student_id_fkey(full_name, email)')
    .eq('assessment_id', params.id)
    .order('submitted_at', { ascending: false });

  const submissions = (data as unknown as SubmissionRow[]) ?? [];
  const config = assessmentTypeConfig(assessment.type);

  return (
    <>
      <PageHeader
        title={assessment.title}
        description={`${config.label} - out of ${assessment.total_marks} marks`}
      />
      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Submissions could not be loaded: {error.message}
        </p>
      ) : null}

      <Card>
        <CardHeader title="Submissions" description={`${submissions.length} received`} />
        <CardBody className="p-0">
          {submissions.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No submissions yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Student</Th>
                  <Th>Answer</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th>Grade</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="align-top">
                    <Td className="font-medium text-slate-900">
                      {submission.profiles?.full_name ?? submission.profiles?.email ?? '-'}
                    </Td>
                    <Td className="max-w-xs">
                      <p className="line-clamp-3 text-xs text-slate-600">
                        {submission.content ?? '-'}
                      </p>
                      {submission.file_url ? (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Attachment
                        </a>
                      ) : null}
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {formatDateTime(submission.submitted_at)}
                    </Td>
                    <Td>
                      <Badge tone={submission.status === 'graded' ? 'green' : 'amber'}>
                        {submission.status}
                      </Badge>
                    </Td>
                     <Td>
                       <GradeForm
                         id={submission.id}
                         assessmentId={params.id}
                         marks={submission.marks}
                         feedback={submission.feedback}
                       />
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
