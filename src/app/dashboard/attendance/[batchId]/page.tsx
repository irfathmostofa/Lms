import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import {
  Badge,
  ButtonLink,
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
import { SessionForm } from '@/components/dashboard/session-form';
import { formatClock } from '@/lib/rooms';
import { formatDate } from '@/lib/utils';
import type { Room } from '@/lib/types';
import type { RoomBooking } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  title: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  room_id: string | null;
  venue: string | null;
  status: string;
  rooms?: { name: string } | null;
}

export default async function BatchAttendancePage({ params }: { params: { batchId: string } }) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { data: batch } = await supabase
    .from('batches')
    .select('id, name, room_id, venue, schedule, instructor_id, courses(title, mode)')
    .eq('id', params.batchId)
    .maybeSingle();
  if (!batch) notFound();
  if (role === 'instructor' && batch.instructor_id !== ctx!.userId) redirect('/dashboard/attendance');

  const [sessionsRes, enrollmentsRes, roomsRes, bookingsRes] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, title, session_date, start_time, end_time, room_id, venue, status, rooms(name)')
      .eq('batch_id', params.batchId)
      .order('session_date', { ascending: false }),
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', params.batchId)
      .in('status', ['pending', 'active', 'completed']),
    supabase.from('rooms').select('*').eq('is_active', true).order('sort_order').order('name'),
    supabase
      .from('class_sessions')
      .select('id, room_id, session_date, start_time, end_time, status, title, batches(name)')
      .neq('status', 'cancelled'),
  ]);

  const sessions = (sessionsRes.data as unknown as SessionRow[]) ?? [];
  const rooms = (roomsRes.data as Room[]) ?? [];
  const bookings: RoomBooking[] = (
    (bookingsRes.data as unknown as (RoomBooking & { batches?: { name: string } | null })[]) ?? []
  ).map((row) => ({
    id: row.id,
    room_id: row.room_id,
    session_date: row.session_date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    title: row.title,
    batch_name: row.batches?.name ?? null,
  }));
  const studentCount = enrollmentsRes.count ?? 0;
  const course = (batch.courses as unknown as { title: string; mode: string } | { title: string; mode: string }[] | null);
  const courseInfo = Array.isArray(course) ? course[0] ?? null : course;

  return (
    <>
      <PageHeader
        title={batch.name}
        description={`${courseInfo?.title ?? 'Course'} · ${studentCount} enrolled · mark attendance by class session.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <FormModal
              title="New class session"
              description="Pick a classroom. Overlapping bookings show as unavailable."
              triggerLabel="Add session"
              triggerSize="sm"
            >
              <SessionForm
                batchId={params.batchId}
                defaultRoomId={batch.room_id}
                rooms={rooms}
                bookings={bookings}
              />
            </FormModal>
            <ButtonLink href="/dashboard/attendance" size="sm" variant="secondary">
              All batches
            </ButtonLink>
          </div>
        }
      />

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
                    <Th>Room</Th>
                    <Th>Time</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <Td className="text-xs text-slate-500">{formatDate(session.session_date)}</Td>
                      <Td className="font-medium text-slate-900">{session.title ?? 'Class'}</Td>
                      <Td className="text-xs text-slate-600">{session.rooms?.name ?? session.venue ?? '-'}</Td>
                      <Td className="text-xs text-slate-500">
                        {session.start_time && session.end_time
                          ? `${formatClock(session.start_time)}–${formatClock(session.end_time)}`
                          : '-'}
                      </Td>
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
      <p className="mt-4 text-sm text-slate-500">
        <Link href="/dashboard/attendance" className="font-medium text-brand-600 hover:underline">
          Back to attendance
        </Link>
      </p>
    </>
  );
}
