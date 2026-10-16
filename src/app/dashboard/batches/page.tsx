import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createBatchAction, createSessionAction } from '@/actions/dashboard';
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
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';

export const dynamic = 'force-dynamic';

interface BatchRow {
  id: string;
  name: string;
  venue: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  is_active: boolean;
  courses: { title: string } | null;
  profiles: { full_name: string | null } | null;
}

interface SessionRow {
  id: string;
  batch_id: string;
  title: string | null;
  session_date: string;
  venue: string | null;
  status: string;
}

export default async function BatchesPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [batchesRes, coursesRes, instructorsRes, sessionsRes] = await Promise.all([
    supabase
      .from('batches')
      .select('id, name, venue, schedule, start_date, end_date, capacity, is_active, courses(title), profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('courses').select('id, title').in('mode', ['offline', 'hybrid']).order('title'),
    supabase.from('profiles').select('id, full_name').eq('role', 'instructor').order('full_name'),
    supabase
      .from('class_sessions')
      .select('id, batch_id, title, session_date, venue, status')
      .order('session_date', { ascending: false })
      .limit(200),
  ]);

  const batches = (batchesRes.data as unknown as BatchRow[]) ?? [];
  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];
  const instructors = (instructorsRes.data as { id: string; full_name: string | null }[]) ?? [];
  const sessions = (sessionsRes.data as SessionRow[]) ?? [];

  return (
    <>
      <PageHeader
        title="Batches"
        description="Offline and hybrid batches with venue, schedule and class sessions."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Create batch" />
          <CardBody>
            <form action={createBatchAction} className="grid gap-3 sm:grid-cols-2">
              <Field label="Course">
                <Select name="course_id" required defaultValue="">
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Batch name">
                <Input name="name" required placeholder="e.g. HSC 2026 Morning" />
              </Field>
              <Field label="Venue">
                <Input name="venue" />
              </Field>
              <Field label="Schedule">
                <Input name="schedule" placeholder="Sat-Tue 4-6 PM" />
              </Field>
              <Field label="Start date">
                <Input name="start_date" type="date" />
              </Field>
              <Field label="End date">
                <Input name="end_date" type="date" />
              </Field>
              <Field label="Capacity">
                <Input name="capacity" type="number" min="0" />
              </Field>
              <Field label="Instructor">
                <Select name="instructor_id" defaultValue="">
                  <option value="">Unassigned</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.full_name ?? instructor.id}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Creating...">Create batch</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Schedule a class session" description="Pick a batch and a date." />
          <CardBody>
            <form action={createSessionAction} className="grid gap-3 sm:grid-cols-2">
              <Field label="Batch">
                <Select name="batch_id" required defaultValue="">
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title">
                <Input name="title" placeholder="e.g. Chapter 3 - Organic Chemistry" />
              </Field>
              <Field label="Date">
                <Input name="session_date" type="date" required />
              </Field>
              <Field label="Venue">
                <Input name="venue" />
              </Field>
              <Field label="Start time">
                <Input name="start_time" type="time" />
              </Field>
              <Field label="End time">
                <Input name="end_time" type="time" />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Scheduling...">Add session</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="All batches" description={`${batches.length} batches`} />
        <CardBody className="p-0">
          {batches.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No batches yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Batch</Th>
                  <Th>Course</Th>
                  <Th>Venue</Th>
                  <Th>Schedule</Th>
                  <Th>Instructor</Th>
                  <Th>Sessions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => {
                  const count = sessions.filter((session) => session.batch_id === batch.id).length;
                  return (
                    <tr key={batch.id}>
                      <Td className="font-medium text-slate-900">
                        {batch.name}
                        {!batch.is_active ? (
                          <Badge tone="red" className="ml-2">
                            inactive
                          </Badge>
                        ) : null}
                      </Td>
                      <Td>{batch.courses?.title ?? '-'}</Td>
                      <Td>{batch.venue ?? '-'}</Td>
                      <Td className="text-xs text-slate-500">{batch.schedule ?? '-'}</Td>
                      <Td>{batch.profiles?.full_name ?? '-'}</Td>
                      <Td>{count}</Td>
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
