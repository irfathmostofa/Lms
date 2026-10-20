import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import {
  updateEnrollmentBatchAction,
  updateEnrollmentFeeAction,
  updateEnrollmentStatusAction,
} from '@/actions/dashboard';
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
  Textarea,
} from '@/components/ui';
import { FormModal } from '@/components/dashboard/form-modal';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface EnrollmentDetail {
  id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  notes: string | null;
  student_id: string;
  course_id: string;
  batch_id: string | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
  courses: { title: string; slug: string } | null;
  batches: { name: string } | null;
}

interface FeeDetail {
  id: string;
  description: string | null;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
  installments: number;
  due_date: string | null;
  status: string;
}

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  status: string;
  trx_id: string | null;
  created_at: string;
}

const statusTone: Record<string, 'amber' | 'green' | 'slate' | 'red'> = {
  pending: 'amber',
  active: 'green',
  completed: 'slate',
  cancelled: 'red',
  expired: 'red',
};

const paymentTone: Record<string, 'amber' | 'green' | 'slate' | 'red'> = {
  pending: 'amber',
  verified: 'green',
  rejected: 'red',
  refunded: 'slate',
  cancelled: 'slate',
};

export default async function EnrollmentDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const { data: enrollmentRow } = await supabase
    .from('enrollments')
    .select(
      'id, status, enrolled_at, completed_at, notes, student_id, course_id, batch_id, profiles!enrollments_student_id_fkey(full_name, email, phone), courses(title, slug), batches(name)',
    )
    .eq('id', params.id)
    .maybeSingle();
  if (!enrollmentRow) notFound();

  const enrollment = enrollmentRow as unknown as EnrollmentDetail;

  const [feeRes, batchesRes, paymentsRes] = await Promise.all([
    supabase.from('fee_records').select('*').eq('enrollment_id', enrollment.id).maybeSingle(),
    supabase
      .from('batches')
      .select('id, name')
      .eq('course_id', enrollment.course_id)
      .order('name'),
    supabase
      .from('payments')
      .select('id, amount, method, status, trx_id, created_at')
      .eq('enrollment_id', enrollment.id)
      .order('created_at', { ascending: false }),
  ]);

  const fee = feeRes.data as FeeDetail | null;
  const batches = (batchesRes.data as { id: string; name: string }[]) ?? [];
  const payments = (paymentsRes.data as PaymentRow[]) ?? [];
  const studentName =
    enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? 'Student';

  return (
    <>
      <PageHeader
        title={studentName}
        description={`${enrollment.courses?.title ?? 'Course'} - enrolled ${formatDate(enrollment.enrolled_at)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[enrollment.status] ?? 'slate'}>{enrollment.status}</Badge>
            <ButtonLink href="/dashboard/enrollments" size="sm" variant="outline">
              Back to enrollments
            </ButtonLink>
            {enrollment.courses?.slug ? (
              <ButtonLink
                href={`/courses/${enrollment.courses.slug}`}
                size="sm"
                variant="secondary"
              >
                View course
              </ButtonLink>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Fee record"
              description="Discounts and installments are managed here."
              action={
                fee ? (
                  <FormModal title="Edit fee record" triggerLabel="Edit fee" triggerVariant="outline" triggerSize="sm">
                    <form action={updateEnrollmentFeeAction} className="grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="fee_id" value={fee.id} />
                      <div className="sm:col-span-2">
                        <Field label="Description">
                          <Input name="description" defaultValue={fee.description ?? ''} />
                        </Field>
                      </div>
                      <Field label="Total fee (BDT)">
                        <Input
                          name="total_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={fee.total_amount}
                          required
                        />
                      </Field>
                      <Field label="Discount (BDT)">
                        <Input
                          name="discount_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={fee.discount_amount}
                        />
                      </Field>
                      <Field label="Installments">
                        <Input
                          name="installments"
                          type="number"
                          min="1"
                          defaultValue={fee.installments}
                        />
                      </Field>
                      <Field label="Due date">
                        <Input name="due_date" type="date" defaultValue={fee.due_date ?? ''} />
                      </Field>
                      <div className="sm:col-span-2">
                        <SubmitButton pendingLabel="Saving...">Save fee record</SubmitButton>
                      </div>
                    </form>
                  </FormModal>
                ) : null
              }
            />
            <CardBody>
              {fee ? (
                <>
                  <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Net</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(fee.net_amount)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Paid</dt>
                      <dd className="mt-1 text-sm font-semibold text-emerald-700">
                        {formatCurrency(fee.paid_amount)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Due</dt>
                      <dd
                        className={
                          fee.due_amount > 0
                            ? 'mt-1 text-sm font-semibold text-red-600'
                            : 'mt-1 text-sm font-semibold text-slate-900'
                        }
                      >
                        {formatCurrency(fee.due_amount)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Status</dt>
                      <dd className="mt-1">
                        <Badge tone={fee.status === 'paid' ? 'green' : fee.due_amount > 0 ? 'amber' : 'slate'}>
                          {fee.status}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <EmptyState
                  title="No fee record"
                  description="Enroll the student again or create the fee record manually."
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payments" description={`${payments.length} submissions`} />
            <CardBody className="p-0">
              {payments.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No payments yet" description="The student has not submitted a payment." />
                </div>
              ) : (
                <Table>
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Date</Th>
                      <Th>Method</Th>
                      <Th>Amount</Th>
                      <Th>TrxID</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <Td className="text-xs text-slate-500">
                          {formatDateTime(payment.created_at)}
                        </Td>
                        <Td className="capitalize">{payment.method}</Td>
                        <Td>{formatCurrency(payment.amount)}</Td>
                        <Td className="font-mono text-xs text-slate-500">
                          {payment.trx_id ?? '-'}
                        </Td>
                        <Td>
                          <Badge tone={paymentTone[payment.status] ?? 'slate'}>
                            {payment.status}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Student" />
            <CardBody className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="text-slate-800">{studentName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="break-all text-slate-800">{enrollment.profiles?.email ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-slate-800">{enrollment.profiles?.phone ?? '-'}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status" description="Activate once the payment is verified." />
            <CardBody>
              <form action={updateEnrollmentStatusAction} className="space-y-3">
                <input type="hidden" name="id" value={enrollment.id} />
                <Field label="Enrollment status">
                  <Select name="status" defaultValue={enrollment.status}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </Select>
                </Field>
                <SubmitButton className="w-full" pendingLabel="Updating...">
                  Update status
                </SubmitButton>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Batch"
              description="Offline and hybrid courses only."
              action={
                <FormModal title="Assign batch" triggerLabel="Edit batch" triggerVariant="outline" triggerSize="sm">
                  <form action={updateEnrollmentBatchAction} className="space-y-3">
                    <input type="hidden" name="id" value={enrollment.id} />
                    <Field label="Assigned batch">
                      <Select name="batch_id" defaultValue={enrollment.batch_id ?? ''}>
                        <option value="">No batch</option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <SubmitButton className="w-full" variant="secondary" pendingLabel="Updating...">
                      Update batch
                    </SubmitButton>
                  </form>
                </FormModal>
              }
            />
            <CardBody>
              <p className="text-sm text-slate-800">{enrollment.batches?.name ?? 'No batch assigned'}</p>
            </CardBody>
          </Card>

          {enrollment.notes ? (
            <Card>
              <CardHeader title="Notes" />
              <CardBody>
                <Textarea readOnly value={enrollment.notes} className="min-h-24 bg-slate-50" />
              </CardBody>
            </Card>
          ) : null}

          <p className="px-1 text-xs text-slate-400">
            Need to remove an enrollment? Cancel it instead so payment history is preserved.
          </p>
          <Link
            href="/dashboard/payments?status=pending"
            className="px-1 text-xs font-medium text-brand-600 hover:underline"
          >
            Review pending payments
          </Link>
        </div>
      </div>
    </>
  );
}
