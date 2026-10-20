import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { AttendanceSheet, type AttendanceStudent } from '@/components/dashboard/attendance-sheet';
import { ButtonLink, Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { formatClock } from '@/lib/rooms';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface EnrollmentRow {
  student_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface AttendanceRow {
  student_id: string;
  status: string;
  remarks: string | null;
}

export default async function SessionAttendancePage({
  params,
}: {
  params: { batchId: string; sessionId: string };
}) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [{ data: session }, { data: batch }] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, batch_id, title, session_date, start_time, end_time, venue, status, rooms(name)')
      .eq('id', params.sessionId)
      .eq('batch_id', params.batchId)
      .maybeSingle(),
    supabase
      .from('batches')
      .select('id, name, instructor_id, courses(title)')
      .eq('id', params.batchId)
      .maybeSingle(),
  ]);
  if (!session || !batch) notFound();
  if (role === 'instructor' && batch.instructor_id !== ctx!.userId) redirect('/dashboard/attendance');

  const [enrollmentsRes, attendanceRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('student_id, profiles!enrollments_student_id_fkey(full_name, email)')
      .eq('batch_id', params.batchId)
      .in('status', ['pending', 'active', 'completed']),
    supabase.from('attendance').select('student_id, status, remarks').eq('session_id', params.sessionId),
  ]);

  const enrollments = (enrollmentsRes.data as unknown as EnrollmentRow[]) ?? [];
  const attendance = (attendanceRes.data as AttendanceRow[]) ?? [];
  const byStudent = new Map(attendance.map((row) => [row.student_id, row]));
  const seen = new Set<string>();
  const students: AttendanceStudent[] = [];

  for (const enrollment of enrollments) {
    if (seen.has(enrollment.student_id)) continue;
    seen.add(enrollment.student_id);
    const row = byStudent.get(enrollment.student_id);
    students.push({
      studentId: enrollment.student_id,
      name: enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? 'Student',
      email: enrollment.profiles?.email ?? null,
      status: row?.status ?? null,
      remarks: row?.remarks ?? null,
    });
  }

  students.sort((a, b) => a.name.localeCompare(b.name));
  const course = batch.courses as unknown as { title: string } | { title: string }[] | null;
  const courseInfo = Array.isArray(course) ? course[0] ?? null : course;
  const roomRel = session.rooms as unknown as { name: string } | { name: string }[] | null;
  const roomName = Array.isArray(roomRel) ? roomRel[0]?.name : roomRel?.name;

  return (
    <>
      <PageHeader
        title={session.title ?? 'Class attendance'}
        description={[
          batch.name,
          courseInfo?.title,
          formatDate(session.session_date),
          roomName ?? session.venue,
          session.start_time && session.end_time
            ? `${formatClock(session.start_time)}–${formatClock(session.end_time)}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        action={
          <ButtonLink href={`/dashboard/attendance/${params.batchId}`} size="sm" variant="secondary">
            Sessions
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader
          title="Roster"
          description={`${students.length} enrolled students. Mark present, late, excused or absent, then save.`}
        />
        <CardBody className="p-0">
          {students.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No enrolled students"
                description="Enroll students in this batch before taking attendance."
              />
            </div>
          ) : (
            <AttendanceSheet sessionId={params.sessionId} batchId={params.batchId} students={students} />
          )}
        </CardBody>
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        <Link href={`/dashboard/attendance/${params.batchId}`} className="font-medium text-brand-600 hover:underline">
          Back to sessions
        </Link>
      </p>
    </>
  );
}
