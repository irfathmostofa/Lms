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
  Table,
  Td,
  Th,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface AttendanceRow {
  id: string;
  status: string;
  remarks: string | null;
  class_sessions: { session_date: string; title: string | null; batches: { name: string } | null } | null;
}

const statusTone: Record<string, 'green' | 'red' | 'amber' | 'blue'> = {
  present: 'green',
  absent: 'red',
  late: 'amber',
  excused: 'blue',
};

export default async function MyAttendancePage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [attendanceRes, summaryRes] = await Promise.all([
    supabase
      .from('attendance')
      .select('id, status, remarks, class_sessions(session_date, title, batches(name))')
      .eq('student_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('vw_student_attendance')
      .select('batch_id, present_count, absent_count, late_count, total_count, attendance_pct')
      .eq('student_id', ctx.userId),
  ]);

  const rows = (attendanceRes.data as unknown as AttendanceRow[]) ?? [];
  const summary = (summaryRes.data as {
    batch_id: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    total_count: number;
    attendance_pct: number;
  }[]) ?? [];

  const totals = summary.reduce(
    (acc, row) => {
      acc.present += Number(row.present_count);
      acc.absent += Number(row.absent_count);
      acc.late += Number(row.late_count);
      acc.total += Number(row.total_count);
      return acc;
    },
    { present: 0, absent: 0, late: 0, total: 0 },
  );
  const overall = totals.total ? Math.round((totals.present / totals.total) * 100) : 0;

  return (
    <>
      <PageHeader title="My attendance" description="Class-by-class attendance across your batches." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Overall" value={`${overall}%`} />
        <StatCard label="Present" value={totals.present} />
        <StatCard label="Late" value={totals.late} />
        <StatCard label="Absent" value={totals.absent} />
      </div>

      <Card>
        <CardHeader title="Attendance history" />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No attendance records"
                description="Attendance is marked by your instructor for offline and hybrid batches."
              />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Class</Th>
                  <Th>Batch</Th>
                  <Th>Status</Th>
                  <Th>Remarks</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <Td className="text-xs text-slate-500">
                      {formatDate(row.class_sessions?.session_date)}
                    </Td>
                    <Td className="font-medium text-slate-900">
                      {row.class_sessions?.title ?? 'Class session'}
                    </Td>
                    <Td>{row.class_sessions?.batches?.name ?? '-'}</Td>
                    <Td>
                      <Badge tone={statusTone[row.status] ?? 'slate'}>{row.status}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{row.remarks ?? '-'}</Td>
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
