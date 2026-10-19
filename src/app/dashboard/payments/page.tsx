import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { PaymentActions } from '@/components/dashboard/payment-actions';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  gateway: string;
  trx_id: string | null;
  sender_number: string | null;
  screenshot_url: string | null;
  status: string;
  purpose: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const statusTone: Record<string, 'amber' | 'green' | 'red' | 'slate'> = {
  pending: 'amber',
  verified: 'green',
  rejected: 'red',
  refunded: 'slate',
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'accountant'].includes(role)) redirect('/dashboard');

  const activeStatus = searchParams.status ?? 'all';
  const supabase = createClient();

  let query = supabase
    .from('payments')
    .select(
      'id, amount, method, gateway, trx_id, sender_number, screenshot_url, status, purpose, created_at, profiles!payments_student_id_fkey(full_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (activeStatus !== 'all') query = query.eq('status', activeStatus);

  const [paymentsRes, pendingCount, verifiedRes] = await Promise.all([
    query,
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payments').select('amount').eq('status', 'verified'),
  ]);

  const payments = (paymentsRes.data as unknown as PaymentRow[]) ?? [];
  const loadError = paymentsRes.error?.message;
  const verifiedTotal = (verifiedRes.data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount: number }).amount ?? 0),
    0,
  );

  const tabs = ['pending', 'verified', 'rejected', 'all'];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Verify manual bKash, Nagad, Rocket and Upay submissions. Duplicate TrxIDs are rejected by the database."
      />

      {loadError ? (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Payments could not be loaded: {loadError}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending verification" value={pendingCount.count ?? 0} />
        <StatCard label="Total verified" value={formatCurrency(verifiedTotal)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab}
            href={`/dashboard/payments?status=${tab}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              activeStatus === tab
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab}
          </a>
        ))}
      </div>

      <Card>
        <CardHeader title={`${activeStatus} payments`} description={`${payments.length} records`} />
        <CardBody className="p-0">
          {payments.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={activeStatus === 'pending' ? 'No pending payments' : 'No payments found'}
                description={
                  activeStatus === 'pending'
                    ? 'New manual submissions will appear here for verification. Switch to All to review payment history.'
                    : 'Payments will appear here once students submit them.'
                }
              />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Student</Th>
                  <Th>Purpose</Th>
                  <Th>Method</Th>
                  <Th>Transaction</Th>
                  <Th>Sender</Th>
                  <Th>Amount</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td className="font-medium text-slate-900">
                      {payment.profiles?.full_name ?? payment.profiles?.email ?? '-'}
                    </Td>
                    <Td className="text-xs capitalize text-slate-500">{payment.purpose}</Td>
                    <Td>
                      <Badge tone="blue">{payment.method}</Badge>
                    </Td>
                    <Td className="font-mono text-xs">
                      {payment.trx_id ?? '-'}
                      {payment.screenshot_url ? (
                        <a
                          href={payment.screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-brand-600 hover:underline"
                        >
                          proof
                        </a>
                      ) : null}
                    </Td>
                    <Td className="text-xs text-slate-500">{payment.sender_number ?? '-'}</Td>
                    <Td className="font-medium">{formatCurrency(payment.amount)}</Td>
                    <Td className="text-xs text-slate-500">{formatDateTime(payment.created_at)}</Td>
                    <Td>
                      <Badge tone={statusTone[payment.status] ?? 'slate'}>{payment.status}</Badge>
                    </Td>
                    <Td>
                      {payment.status === 'pending' ? (
                        <PaymentActions id={payment.id} />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
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
