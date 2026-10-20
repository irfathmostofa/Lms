import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createBatchAction } from '@/actions/dashboard';
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
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { FormModal } from '@/components/dashboard/form-modal';
import { SessionForm } from '@/components/dashboard/session-form';
import { SubmitButton } from '@/components/dashboard/submit-button';
import type { Room } from '@/lib/types';
import type { RoomBooking } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

interface BatchRow {
  id: string;
  name: string;
  room_id: string | null;
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
  start_time: string | null;
  end_time: string | null;
  room_id: string | null;
  venue: string | null;
  status: string;
  batches?: { name: string } | null;
}

export default async function BatchesPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [batchesRes, coursesRes, instructorsRes, sessionsRes, roomsRes] = await Promise.all([
    supabase
      .from('batches')
      .select('id, name, room_id, venue, schedule, start_date, end_date, capacity, is_active, courses(title), profiles!batches_instructor_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('courses').select('id, title').in('mode', ['offline', 'hybrid']).order('title'),
    supabase.from('profiles').select('id, full_name').eq('role', 'instructor').order('full_name'),
    supabase
      .from('class_sessions')
      .select('id, batch_id, title, session_date, start_time, end_time, room_id, venue, status, batches(name)')
      .order('session_date', { ascending: false })
      .limit(200),
    supabase.from('rooms').select('*').eq('is_active', true).order('sort_order').order('name'),
  ]);

  const batches = (batchesRes.data as unknown as BatchRow[]) ?? [];
  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];
  const instructors = (instructorsRes.data as { id: string; full_name: string | null }[]) ?? [];
  const sessions = (sessionsRes.data as unknown as SessionRow[]) ?? [];
  const rooms = (roomsRes.data as Room[]) ?? [];
  const bookings: RoomBooking[] = sessions.map((session) => ({
    id: session.id,
    room_id: session.room_id,
    session_date: session.session_date,
    start_time: session.start_time,
    end_time: session.end_time,
    status: session.status,
    title: session.title,
    batch_name: session.batches?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Batches"
        description="Offline and hybrid batches with classroom, schedule and class sessions."
        action={
          <div className="flex flex-wrap gap-2">
            <FormModal title="Create batch" triggerLabel="Create batch">
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
              <Field label="Classroom">
                <Select name="room_id" defaultValue="">
                  <option value="">No room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.location ? ` · ${room.location}` : ''}
                      {room.capacity ? ` (${room.capacity})` : ''}
                    </option>
                  ))}
                </Select>
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
            </FormModal>
            <FormModal
              title="Schedule a class session"
              description="Pick a batch, date and classroom. Booked rooms are marked unavailable for overlapping times."
              triggerLabel="Add session"
              triggerVariant="secondary"
            >
              <SessionForm
                batches={batches.map((batch) => ({ id: batch.id, name: batch.name, room_id: batch.room_id }))}
                rooms={rooms}
                bookings={bookings}
              />
            </FormModal>
          </div>
        }
      />

      <Card>
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
                  <Th>Classroom</Th>
                  <Th>Schedule</Th>
                  <Th>Instructor</Th>
                  <Th>Sessions</Th>
                  <Th />
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
                      <Td>
                        <ButtonLink href={`/dashboard/attendance/${batch.id}`} size="sm" variant="secondary">
                          Attendance
                        </ButtonLink>
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
