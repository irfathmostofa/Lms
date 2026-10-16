import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface CourseRow {
  course_id: string;
  is_lead: boolean;
  courses: { id: string; title: string; mode: string; status: string } | null;
}

interface SessionRow {
  id: string;
  session_date: string;
  title: string | null;
  status: string;
  batches: { name: string } | null;
}

export default async function InstructorHomePage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [assignmentsRes, batchesRes, assessmentsRes] = await Promise.all([
    supabase
      .from('course_instructors')
      .select('course_id, is_lead, courses(id, title, mode, status)')
      .eq('instructor_id', ctx!.userId),
    supabase.from('batches').select('id').eq('instructor_id', ctx!.userId),
    supabase
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', ctx!.userId),
  ]);

  const assignments = (assignmentsRes.data as unknown as CourseRow[]) ?? [];
  const batchIds = ((batchesRes.data as { id: string }[]) ?? []).map((batch) => batch.id);

  const sessionsRes = batchIds.length
    ? await supabase
        .from('class_sessions')
        .select('id, session_date, title, status, batches(name)')
        .in('batch_id', batchIds)
        .order('session_date', { ascending: false })
        .limit(10)
    : { data: [] as unknown[] };

  const sessions = (sessionsRes.data as unknown as SessionRow[]) ?? [];

  return (
    <>
      <PageHeader
        title="Instructor"
        description="Your courses, batches, upcoming classes and assessments."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Assigned courses" value={assignments.length} />
        <StatCard label="Your batches" value={batchIds.length} />
        <StatCard label="Assessments created" value={assessmentsRes.count ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="My courses" />
          <CardBody className="p-0">
            {assignments.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No courses assigned" />
              </div>
            ) : (
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Course</Th>
                    <Th>Mode</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => (
                    <tr key={assignment.course_id}>
                      <Td className="font-medium text-slate-900">
                        {assignment.courses?.title ?? 'Course'}
                        {assignment.is_lead ? (
                          <Badge tone="blue" className="ml-2">
                            lead
                          </Badge>
                        ) : null}
                      </Td>
                      <Td>
                        <Badge>{assignment.courses?.mode ?? '-'}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={assignment.courses?.status === 'published' ? 'green' : 'slate'}>
                          {assignment.courses?.status ?? '-'}
                        </Badge>
                      </Td>
                      <Td>
                        <Link
                          href={`/dashboard/content/${assignment.course_id}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          Curriculum
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent class sessions" />
          <CardBody className="p-0">
            {sessions.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No sessions scheduled" description="Create one under Batches." />
              </div>
            ) : (
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Date</Th>
                    <Th>Class</Th>
                    <Th>Batch</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <Td className="text-xs text-slate-500">{formatDate(session.session_date)}</Td>
                      <Td className="font-medium text-slate-900">{session.title ?? 'Class'}</Td>
                      <Td>{session.batches?.name ?? '-'}</Td>
                      <Td>
                        <Badge tone={session.status === 'completed' ? 'green' : 'amber'}>
                          {session.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
