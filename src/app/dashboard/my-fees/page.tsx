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
import { ManualPaymentForm } from '@/components/dashboard/manual-payment-form';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface FeeRow {
  id: string;
  enrollment_id: string;
  description: string | null;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  due_date: string | null;
  enrollments: { courses: { title: string } | null } | null;
}

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  trx_id: string | null;
  status: string;
  created_at: string;
}

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  verified: 'green',
  pending: 'amber',
  rejected: 'red',
};

export default async function MyFeesPage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [feesRes, paymentsRes, methodsRes, settingsRes] = await Promise.all([
    supabase
      .from('fee_records')
      .select(
        'id, enrollment_id, description, total_amount, discount_amount, net_amount, paid_amount, due_amount, status, due_date, enrollments(courses(title))',
      )
      .eq('student_id', ctx.userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('id, amount, method, trx_id, status, created_at')
      .eq('student_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('lookups').select('code, label').eq('type', 'payment_method').eq('is_active', true).order('sort_order'),
    supabase.from('settings').select('key, value').in('key', ['payment_instructions', 'site_name']),
  ]);

  const fees = (feesRes.data as unknown as FeeRow[]) ?? [];
  const payments = (paymentsRes.data as PaymentRow[]) ?? [];
  const methods = (methodsRes.data as { code: string; label: string }[]) ?? [];
  const settings = new Map((settingsRes.data as { key: string; value: string | null }[]).map((s) => [s.key, s.value]));

  const totalDue = fees.reduce((sum, fee) => sum + Number(fee.due_amount), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paid_amount), 0);
  const payable = fees.find((fee) => Number(fee.due_amount) > 0);

  return (
    <>
      <PageHeader title="My fees" description="Fee records, dues and payment submissions." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatCurrency(fees.reduce((s, f) => s + Number(f.net_amount), 0))} />
        <StatCard label="Paid" value={formatCurrency(totalPaid)} />
        <StatCard label="Due" value={formatCurrency(totalDue)} />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Submit a manual payment"
          description={settings.get('payment_instructions') ?? undefined}
        />
        <CardBody>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">How it works</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
                <li>Send money using bKash, Nagad, Rocket or Upay.</li>
                <li>Submit the method, TrxID and amount below.</li>
                <li>An admin or accountant verifies it.</li>
                <li>Your enrollment and access activate automatically.</li>
              </ol>
              <p className="mt-3 text-xs text-slate-400">
                Duplicate transaction IDs are rejected automatically.
              </p>
            </div>
            <ManualPaymentForm
              enrollmentId={payable?.enrollment_id}
              methods={methods}
              suggestedAmount={payable ? Number(payable.due_amount) : undefined}
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Fee records" />
        <CardBody className="p-0">
          {fees.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No fee records" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Course</Th>
                  <Th>Net</Th>
                  <Th>Discount</Th>
                  <Th>Paid</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  <Th>Due date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <Td className="font-medium text-slate-900">
                      {fee.enrollments?.courses?.title ?? fee.description ?? 'Course'}
                    </Td>
                    <Td>{formatCurrency(fee.net_amount)}</Td>
                    <Td>{formatCurrency(fee.discount_amount)}</Td>
                    <Td className="text-emerald-700">{formatCurrency(fee.paid_amount)}</Td>
                    <Td className={Number(fee.due_amount) > 0 ? 'text-red-600' : ''}>
                      {formatCurrency(fee.due_amount)}
                    </Td>
                    <Td>
                      <Badge tone={fee.status === 'paid' ? 'green' : fee.status === 'partial' ? 'amber' : 'slate'}>
                        {fee.status}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(fee.due_date)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="My payment submissions" />
        <CardBody className="p-0">
          {payments.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No payments submitted yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Method</Th>
                  <Th>Transaction</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Submitted</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td>
                      <Badge tone="blue">{payment.method}</Badge>
                    </Td>
                    <Td className="font-mono text-xs">{payment.trx_id ?? '-'}</Td>
                    <Td>{formatCurrency(payment.amount)}</Td>
                    <Td>
                      <Badge tone={statusTone[payment.status] ?? 'slate'}>{payment.status}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(payment.created_at)}</Td>
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
