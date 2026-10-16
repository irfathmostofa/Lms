import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Table, Td, Th } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Course } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'editor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { data } = await supabase
    .from('courses')
    .select('id, title, slug, status, mode, total_lessons, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  const courses = (data as Course[]) ?? [];

  return (
    <>
      <PageHeader
        title="Content"
        description="Build curriculum: sections and lessons with text, images, PDFs and YouTube."
      />

      <Card>
        <CardHeader title="Select a course" description="Open a course to manage its curriculum." />
        <CardBody className="p-0">
          {courses.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No courses yet" description="Create a course first." />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th>Mode</Th>
                  <Th>Status</Th>
                  <Th>Lessons</Th>
                  <Th>Updated</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <Td className="font-medium text-slate-900">{course.title}</Td>
                    <Td>
                      <Badge>{course.mode}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={course.status === 'published' ? 'green' : 'slate'}>
                        {course.status}
                      </Badge>
                    </Td>
                    <Td>{course.total_lessons}</Td>
                    <Td className="text-xs text-slate-500">{formatDate(course.updated_at)}</Td>
                    <Td>
                      <Link
                        href={`/dashboard/content/${course.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Manage
                      </Link>
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
