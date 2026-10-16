import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard, Badge, Td, Th, Table } from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect(ROLE_HOME[role]);

  const supabase = createClient();

  const [
    students,
    activeEnrollments,
    pendingPayments,
    publishedCourses,
    verifiedPayments,
    recentPending,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('payments').select('amount').eq('status', 'verified'),
    supabase
      .from('payments')
      .select('id, amount, method, trx_id, created_at, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const totalIncome = (verifiedPayments.data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount: number }).amount ?? 0),
    0,
  );

  const queue = (recentPending.data ?? []) as unknown as Array<{
    id: string;
    amount: number;
    method: string;
    trx_id: string | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }>;

  return (
    <>
      <PageHeader
        title="Admin overview"
        description="Platform-wide activity across users, courses, payments and finance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={students.count ?? 0} />
        <StatCard label="Active enrollments" value={activeEnrollments.count ?? 0} />
        <StatCard label="Published courses" value={publishedCourses.count ?? 0} />
        <StatCard
          label="Pending payments"
          value={pendingPayments.count ?? 0}
          hint="Awaiting verification"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <StatCard label="Verified income" value={formatCurrency(totalIncome)} />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Payments awaiting verification"
            description="The most recent manual submissions from students."
          />
          <CardBody className="p-0">
            {queue.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No pending payments" />
              </div>
            ) : (
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Student</Th>
                    <Th>Method</Th>
                    <Th>Transaction</Th>
                    <Th>Amount</Th>
                    <Th>Submitted</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((payment) => (
                    <tr key={payment.id}>
                      <Td>{payment.profiles?.full_name ?? '-'}</Td>
                      <Td>
                        <Badge tone="blue">{payment.method}</Badge>
                      </Td>
                      <Td className="font-mono text-xs">{payment.trx_id ?? '-'}</Td>
                      <Td>{formatCurrency(payment.amount)}</Td>
                      <Td className="text-xs text-slate-500">
                        {formatDateTime(payment.created_at)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
