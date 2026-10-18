import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { setCourseStatusAction } from '@/actions/dashboard';
import {
  Badge,
  Button,
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
import { Pagination } from '@/components/dashboard/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Course, CourseVisibility } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const statusTone: Record<string, 'slate' | 'amber' | 'green' | 'violet'> = {
  draft: 'slate',
  review: 'amber',
  published: 'green',
  archived: 'violet',
};

const visibilityTone: Record<CourseVisibility, 'green' | 'amber' | 'slate'> = {
  public: 'green',
  password: 'amber',
  private: 'slate',
};

export default async function CoursesAdminPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'editor', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { count } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(searchParams.page ?? '1') || 1), totalPages);
  const from = (page - 1) * PAGE_SIZE;

  const { data } = await supabase
    .from('courses')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const courses = (data as Course[]) ?? [];
  const isAdmin = role === 'admin';
  const canSetup = ['admin', 'editor'].includes(role);

  return (
    <>
      <PageHeader
        title="Courses"
        description="Build courses in three steps, move them through review, and publish (admin only)."
        action={
          canSetup ? (
            <ButtonLink href="/dashboard/courses/new" size="sm">
              New course
            </ButtonLink>
          ) : undefined
        }
      />

      <Card>
        <CardHeader title="All courses" description={`${total} courses`} />
        <CardBody className="p-0">
          {courses.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No courses yet"
                description={canSetup ? 'Create your first course to get started.' : undefined}
              />
            </div>
          ) : (
            <>
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th className="hidden lg:table-cell">Visibility</Th>
                  <Th className="hidden xl:table-cell">Mode</Th>
                  <Th>Status</Th>
                  <Th className="hidden lg:table-cell">Price</Th>
                  <Th className="hidden xl:table-cell">Updated</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <Td>
                      <span className="font-medium text-slate-900">{course.title}</span>
                      <span className="ml-2 hidden font-mono text-xs text-slate-400 sm:inline">
                        {course.slug}
                      </span>
                      {course.author_name ? (
                        <p className="mt-0.5 text-xs text-slate-400">by {course.author_name}</p>
                      ) : null}
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <Badge tone={visibilityTone[course.visibility] ?? 'slate'}>
                        {course.visibility ?? 'public'}
                      </Badge>
                    </Td>
                    <Td className="hidden xl:table-cell">
                      <Badge>{course.mode}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone[course.status]}>{course.status}</Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      {formatCurrency(course.discount_price ?? course.price)}
                    </Td>
                    <Td className="hidden text-xs text-slate-500 xl:table-cell">
                      {formatDate(course.updated_at)}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {canSetup ? (
                          <ButtonLink
                            href={`/dashboard/courses/${course.id}/setup`}
                            size="sm"
                            variant="secondary"
                          >
                            Setup
                          </ButtonLink>
                        ) : null}
                        {canSetup && course.status !== 'review' && course.status !== 'published' ? (
                          <form action={setCourseStatusAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="status" value="review" />
                            <Button type="submit" size="sm" variant="secondary">
                              Submit for review
                            </Button>
                          </form>
                        ) : null}
                        {isAdmin && course.status !== 'published' ? (
                          <form action={setCourseStatusAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="status" value="published" />
                            <Button type="submit" size="sm" variant="success">
                              Publish
                            </Button>
                          </form>
                        ) : null}
                        {isAdmin && course.status === 'published' ? (
                          <form action={setCourseStatusAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="status" value="archived" />
                            <Button type="submit" size="sm" variant="outline">
                              Archive
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              page={page}
              totalItems={total}
              pageSize={PAGE_SIZE}
              basePath="/dashboard/courses"
              searchParams={searchParams}
            />
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
}
