import Link from 'next/link';
import { redirect } from 'next/navigation';
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

export const dynamic = 'force-dynamic';

interface BatchRow {
  id: string;
  name: string;
  venue: string | null;
  schedule: string | null;
  is_active: boolean;
  instructor_id: string | null;
  courses: { title: string; mode: string } | null;
}

export default async function AttendanceBatchesPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  let query = supabase
    .from('batches')
    .select('id, name, venue, schedule, is_active, instructor_id, courses(title, mode)')
    .eq('is_active', true)
    .order('name');
  if (role === 'instructor') {
    query = query.eq('instructor_id', ctx!.userId);
  }

  const { data } = await query;
  const batches = (data as unknown as BatchRow[]) ?? [];
  const offline = batches.filter((batch) => {
    const mode = batch.courses?.mode;
    return mode === 'offline' || mode === 'hybrid' || !mode;
  });

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark attendance by course batch for offline and hybrid classes."
      />

      <Card>
        <CardHeader title="Course batches" description={`${offline.length} batches`} />
        <CardBody className="p-0">
          {offline.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No batches assigned"
                description="Offline and hybrid batches you teach will appear here."
              />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Batch</Th>
                  <Th>Course</Th>
                  <Th>Schedule</Th>
                  <Th>Venue</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offline.map((batch) => (
                  <tr key={batch.id}>
                    <Td className="font-medium text-slate-900">{batch.name}</Td>
                    <Td>
                      {batch.courses?.title ?? '-'}
                      {batch.courses?.mode ? (
                        <Badge className="ml-2">{batch.courses.mode}</Badge>
                      ) : null}
                    </Td>
                    <Td className="text-xs text-slate-500">{batch.schedule ?? '-'}</Td>
                    <Td>{batch.venue ?? '-'}</Td>
                    <Td>
                      <ButtonLink href={`/dashboard/attendance/${batch.id}`} size="sm" variant="secondary">
                        Open
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
        <Link href="/dashboard/batches" className="font-medium text-brand-600 hover:underline">
          Manage batches and class sessions
        </Link>
      </p>
    </>
  );
}
