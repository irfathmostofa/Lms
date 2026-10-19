import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { EnrollmentForm } from '@/components/dashboard/enrollment-form';
import { Pagination } from '@/components/dashboard/pagination';
import {
  Badge,
  Button,
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
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

interface EnrollmentRow {
  id: string;
  status: string;
  enrolled_at: string;
  student_id: string;
  course_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
  courses: { title: string } | null;
  batches: { name: string } | null;
}

interface FeeRow {
  enrollment_id: string;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
}

const statusTone: Record<string, 'amber' | 'green' | 'slate' | 'red'> = {
  pending: 'amber',
  active: 'green',
  completed: 'slate',
  cancelled: 'red',
  expired: 'red',
};

const errorMessages: Record<string, string> = {
  missing: 'Choose both a student and a course.',
  student: 'That account is not a student.',
  course: 'That course no longer exists.',
  batch: 'The selected batch does not belong to this course.',
  duplicate: 'That student is already enrolled in this course.',
  save: 'The enrollment could not be saved. Please try again.',
};

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    course?: string;
    page?: string;
    error?: string;
    created?: string;
  };
}) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const q = (searchParams.q ?? '').replace(/[,()]/g, ' ').trim();
  const status = searchParams.status && searchParams.status !== 'all' ? searchParams.status : '';
  const courseFilter = searchParams.course ?? '';
  const requestedPage = Math.max(1, Number(searchParams.page ?? '1') || 1);

  const [studentsRes, coursesRes, batchesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'student')
      .order('full_name')
      .limit(500),
    supabase.from('courses').select('id, title, price, discount_price').order('title'),
    supabase.from('batches').select('id, name, course_id').order('name'),
  ]);

  const students =
    (studentsRes.data as { id: string; full_name: string | null; email: string | null }[]) ?? [];
  const courses =
    (coursesRes.data as { id: string; title: string; price: number; discount_price: number | null }[]) ??
    [];
  const batches =
    (batchesRes.data as { id: string; name: string; course_id: string }[]) ?? [];

  let studentIds: string[] = [];
  let courseIds: string[] = [];
  if (q) {
    const [matchedStudents, matchedCourses] = await Promise.all([
      supabase
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(100),
      supabase.from('courses').select('id').ilike('title', `%${q}%`).limit(100),
    ]);
    studentIds = ((matchedStudents.data as { id: string }[]) ?? []).map((row) => row.id);
    courseIds = ((matchedCourses.data as { id: string }[]) ?? []).map((row) => row.id);
  }

  const searchFilter =
    q && (studentIds.length > 0 || courseIds.length > 0)
      ? [
          studentIds.length > 0 ? `student_id.in.(${studentIds.join(',')})` : null,
          courseIds.length > 0 ? `course_id.in.(${courseIds.join(',')})` : null,
        ]
          .filter(Boolean)
          .join(',')
      : null;

  const canQuery = !q || Boolean(searchFilter);

  let total = 0;
  if (canQuery) {
    let countQuery = supabase.from('enrollments').select('id', { count: 'exact', head: true });
    if (status) countQuery = countQuery.eq('status', status);
    if (courseFilter) countQuery = countQuery.eq('course_id', courseFilter);
    if (searchFilter) countQuery = countQuery.or(searchFilter);
    const { count } = await countQuery;
    total = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * PAGE_SIZE;

  let enrollments: EnrollmentRow[] = [];
  if (total > 0) {
    let query = supabase
      .from('enrollments')
      .select(
        'id, status, enrolled_at, student_id, course_id, profiles!enrollments_student_id_fkey(full_name, email), courses(title), batches(name)',
        { count: 'exact' },
      )
      .order('enrolled_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (status) query = query.eq('status', status);
    if (courseFilter) query = query.eq('course_id', courseFilter);
    if (searchFilter) query = query.or(searchFilter);

    const { data } = await query;
    enrollments = (data as unknown as EnrollmentRow[]) ?? [];
  }

  const feesRes =
    enrollments.length > 0
      ? await supabase
          .from('fee_records')
          .select('enrollment_id, net_amount, paid_amount, due_amount')
          .in(
            'enrollment_id',
            enrollments.map((enrollment) => enrollment.id),
          )
      : { data: [] };
  const fees = (feesRes.data as FeeRow[]) ?? [];
  const feeByEnrollment = new Map(fees.map((fee) => [fee.enrollment_id, fee]));

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Enroll a student, then manage status, batch, fees and payments."
      />

      {searchParams.error && errorMessages[searchParams.error] ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessages[searchParams.error]}
        </div>
      ) : null}
      {searchParams.created ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Student enrolled. A fee record was created.
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader title="Enroll a student" description="A fee record is created automatically." />
        <CardBody>
          <EnrollmentForm
            students={students.map((student) => ({
              id: student.id,
              label: student.full_name ?? student.email ?? student.id,
            }))}
            courses={courses}
            batches={batches}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="All enrollments"
          description={total === 0 ? 'No records match these filters.' : `${total} records`}
        />
        <CardBody className="border-b border-slate-100 p-4">
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" action="/dashboard/enrollments">
            <Field label="Search">
              <Input name="q" defaultValue={searchParams.q ?? ''} placeholder="Student name, email or course" />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={searchParams.status ?? 'all'}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </Select>
            </Field>
            <Field label="Course">
              <Select name="course" defaultValue={courseFilter}>
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" className="w-full sm:w-auto">
                Apply filters
              </Button>
              <ButtonLink
                href="/dashboard/enrollments"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Reset
              </ButtonLink>
            </div>
          </form>
        </CardBody>

        {enrollments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={total === 0 && (q || status || courseFilter) ? 'No matching enrollments' : 'No enrollments yet'}
              description="Enroll a student above to create the first record."
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {enrollments.map((enrollment) => {
                const fee = feeByEnrollment.get(enrollment.id);
                return (
                  <div key={enrollment.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? '-'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {enrollment.courses?.title ?? '-'}
                          {enrollment.batches?.name ? ` - ${enrollment.batches.name}` : ''}
                        </p>
                      </div>
                      <Badge tone={statusTone[enrollment.status] ?? 'slate'}>
                        {enrollment.status}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-slate-400">Fee</dt>
                        <dd className="font-medium text-slate-700">
                          {fee ? formatCurrency(fee.net_amount) : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Due</dt>
                        <dd className={fee && fee.due_amount > 0 ? 'text-red-600' : 'text-slate-700'}>
                          {fee ? formatCurrency(fee.due_amount) : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Paid</dt>
                        <dd className="text-emerald-700">
                          {fee ? formatCurrency(fee.paid_amount) : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Enrolled</dt>
                        <dd className="text-slate-700">{formatDate(enrollment.enrolled_at)}</dd>
                      </div>
                    </dl>
                    <ButtonLink
                      href={`/dashboard/enrollments/${enrollment.id}`}
                      size="sm"
                      variant="secondary"
                      className="w-full"
                    >
                      Manage enrollment
                    </ButtonLink>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Student</Th>
                    <Th>Course</Th>
                    <Th>Status</Th>
                    <Th>Fee</Th>
                    <Th className="hidden lg:table-cell">Paid</Th>
                    <Th>Due</Th>
                    <Th className="hidden xl:table-cell">Enrolled</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.map((enrollment) => {
                    const fee = feeByEnrollment.get(enrollment.id);
                    return (
                      <tr key={enrollment.id}>
                        <Td>
                          <p className="font-medium text-slate-900">
                            {enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? '-'}
                          </p>
                          {enrollment.profiles?.email && enrollment.profiles?.full_name ? (
                            <p className="text-xs text-slate-400">{enrollment.profiles.email}</p>
                          ) : null}
                        </Td>
                        <Td>
                          <p className="text-slate-700">{enrollment.courses?.title ?? '-'}</p>
                          <p className="text-xs text-slate-400">
                            {enrollment.batches?.name ?? 'No batch'}
                          </p>
                        </Td>
                        <Td>
                          <Badge tone={statusTone[enrollment.status] ?? 'slate'}>
                            {enrollment.status}
                          </Badge>
                        </Td>
                        <Td>{fee ? formatCurrency(fee.net_amount) : '-'}</Td>
                        <Td className="hidden text-emerald-700 lg:table-cell">
                          {fee ? formatCurrency(fee.paid_amount) : '-'}
                        </Td>
                        <Td className={fee && fee.due_amount > 0 ? 'text-red-600' : ''}>
                          {fee ? formatCurrency(fee.due_amount) : '-'}
                        </Td>
                        <Td className="hidden text-xs text-slate-500 xl:table-cell">
                          {formatDate(enrollment.enrolled_at)}
                        </Td>
                        <Td>
                          <Link
                            href={`/dashboard/enrollments/${enrollment.id}`}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            Manage
                          </Link>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <Pagination
              page={page}
              totalItems={total}
              pageSize={PAGE_SIZE}
              basePath="/dashboard/enrollments"
              searchParams={searchParams}
            />
          </>
        )}
      </Card>
    </>
  );
}
