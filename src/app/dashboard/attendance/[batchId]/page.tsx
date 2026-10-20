import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createSessionAction } from '@/actions/dashboard';
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  title: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  status: string;
}

export default async function BatchAttendancePage({ params }: { params: { batchId: string } }) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { data: batch } = await supabase
    .from('batches')
    .select('id, name, venue, schedule, instructor_id, courses(title, mode)')
    .eq('id', params.batchId)
    .maybeSingle();
  if (!batch) notFound();
  if (role === 'instructor' && batch.instructor_id !== ctx!.userId) redirect('/dashboard/attendance');

  const [sessionsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, title, session_date, start_time, end_time, venue, status')
      .eq('batch_id', params.batchId)
      .order('session_date', { ascending: false }),
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', params.batchId)
      .in('status', ['pending', 'active', 'completed']),
  ]);

  const sessions = (sessionsRes.data as SessionRow[]) ?? [];
  const studentCount = enrollmentsRes.count ?? 0;
  const course = (batch.courses as unknown as { title: string; mode: string } | { title: string; mode: string }[] | null);
  const courseInfo = Array.isArray(course) ? course[0] ?? null : course;

  return (
    <>
      <PageHeader
        title={batch.name}
        description={`${courseInfo?.title ?? 'Course'} · ${studentCount} enrolled · mark attendance by class session.`}
        action={
          <ButtonLink href="/dashboard/attendance" size="sm" variant="secondary">
            All batches
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="New class session" description="Create a date, then mark the roster." />
          <CardBody>
            <form action={createSessionAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="batch_id" value={params.batchId} />
              <Field label="Title">
                <Input name="title" placeholder="e.g. Chapter 3" />
              </Field>
              <Field label="Date">
                <Input name="session_date" type="date" required />
              </Field>
              <Field label="Start time">
                <Input name="start_time" type="time" />
              </Field>
              <Field label="End time">
                <Input name="end_time" type="time" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Venue">
                  <Input name="venue" defaultValue={batch.venue ?? ''} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Scheduling...">Add session</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Class sessions" description={`${sessions.length} sessions`} />
          <CardBody className="p-0">
            {sessions.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No sessions yet" description="Add a class date to take attendance." />
              </div>
            ) : (
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Date</Th>
                    <Th>Class</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <Td className="text-xs text-slate-500">{formatDate(session.session_date)}</Td>
                      <Td className="font-medium text-slate-900">{session.title ?? 'Class'}</Td>
                      <Td>
                        <Badge tone={session.status === 'completed' ? 'green' : 'amber'}>{session.status}</Badge>
                      </Td>
                      <Td>
                        <ButtonLink
                          href={`/dashboard/attendance/${params.batchId}/${session.id}`}
                          size="sm"
                          variant="secondary"
                        >
                          Mark
                        </ButtonLink>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        <Link href="/dashboard/attendance" className="font-medium text-brand-600 hover:underline">
          Back to attendance
        </Link>
      </p>
    </>
  );
}
