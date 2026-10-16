import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createEnrollmentAction } from '@/actions/dashboard';
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
  Textarea,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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

const statusTone: Record<string, 'amber' | 'green' | 'slate' | 'red'> = {
  pending: 'amber',
  active: 'green',
  completed: 'slate',
  cancelled: 'red',
};

export default async function EnrollmentsPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [enrollmentsRes, studentsRes, coursesRes, batchesRes, feesRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select(
        'id, status, enrolled_at, student_id, course_id, profiles(full_name, email), courses(title), batches(name)',
      )
      .order('enrolled_at', { ascending: false })
      .limit(100),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name'),
    supabase.from('courses').select('id, title').order('title'),
    supabase.from('batches').select('id, name, course_id').order('name'),
    supabase.from('fee_records').select('enrollment_id, net_amount, paid_amount, due_amount'),
  ]);

  const enrollments = (enrollmentsRes.data as unknown as EnrollmentRow[]) ?? [];
  const students = (studentsRes.data as { id: string; full_name: string | null; email: string | null }[]) ?? [];
  const courses = (coursesRes.data as { id: string; title: string }[]) ?? [];
  const batches = (batchesRes.data as { id: string; name: string; course_id: string }[]) ?? [];
  const fees = (feesRes.data as { enrollment_id: string; net_amount: number; paid_amount: number; due_amount: number }[]) ?? [];

  const feeByEnrollment = new Map(fees.map((fee) => [fee.enrollment_id, fee]));

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Enroll a student, then record discounts, installments and payments."
      />

      <Card className="mb-6">
        <CardHeader title="Enroll a student" description="A fee record is created automatically." />
        <CardBody>
          <form action={createEnrollmentAction} className="grid gap-3 sm:grid-cols-3">
            <Field label="Student">
              <Select name="student_id" required defaultValue="">
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name ?? student.email ?? student.id}
                  </option>
                ))}
              </Select>
            </Field>
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
            <Field label="Batch (optional)">
              <Select name="batch_id" defaultValue="">
                <option value="">No batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Total fee (BDT)">
              <Input name="total_amount" type="number" min="0" step="0.01" defaultValue="0" required />
            </Field>
            <Field label="Discount (BDT)">
              <Input name="discount_amount" type="number" min="0" step="0.01" defaultValue="0" />
            </Field>
            <Field label="Installments">
              <Input name="installments" type="number" min="1" defaultValue="1" />
            </Field>
            <Field label="Due date">
              <Input name="due_date" type="date" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea name="notes" className="min-h-[42px]" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <SubmitButton pendingLabel="Enrolling...">Enroll student</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="All enrollments" description={`${enrollments.length} records`} />
        <CardBody className="p-0">
          {enrollments.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No enrollments yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Batch</Th>
                  <Th>Status</Th>
                  <Th>Fee</Th>
                  <Th>Paid</Th>
                  <Th>Due</Th>
                  <Th>Enrolled</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enrollment) => {
                  const fee = feeByEnrollment.get(enrollment.id);
                  return (
                    <tr key={enrollment.id}>
                      <Td className="font-medium text-slate-900">
                        {enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? '-'}
                      </Td>
                      <Td>{enrollment.courses?.title ?? '-'}</Td>
                      <Td>{enrollment.batches?.name ?? '-'}</Td>
                      <Td>
                        <Badge tone={statusTone[enrollment.status] ?? 'slate'}>
                          {enrollment.status}
                        </Badge>
                      </Td>
                      <Td>{fee ? formatCurrency(fee.net_amount) : '-'}</Td>
                      <Td className="text-emerald-700">
                        {fee ? formatCurrency(fee.paid_amount) : '-'}
                      </Td>
                      <Td className={fee && fee.due_amount > 0 ? 'text-red-600' : ''}>
                        {fee ? formatCurrency(fee.due_amount) : '-'}
                      </Td>
                      <Td className="text-xs text-slate-500">{formatDate(enrollment.enrolled_at)}</Td>
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
