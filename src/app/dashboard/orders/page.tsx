import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { updateOrderStatusAction } from '@/actions/dashboard';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface OrderRow {
  id: string;
  order_no: string;
  status: string;
  total: number;
  created_at: string;
  shipping_name: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

const statusTone: Record<string, 'amber' | 'green' | 'blue' | 'violet' | 'red' | 'slate'> = {
  pending: 'amber',
  paid: 'green',
  processing: 'blue',
  shipped: 'violet',
  delivered: 'green',
  cancelled: 'red',
  refunded: 'slate',
};

const allStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default async function OrdersPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select('id, order_no, status, total, created_at, shipping_name, profiles!orders_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  const orders = (data as unknown as OrderRow[]) ?? [];

  return (
    <>
      <PageHeader
        title="Store orders"
        description="Track physical book orders and digital purchases. Paid orders grant product access automatically."
      />

      <Card>
        <CardHeader title="Orders" description={`${orders.length} orders`} />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No orders yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Placed</Th>
                  <Th>Update</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <Td className="font-mono text-xs">{order.order_no}</Td>
                    <Td className="font-medium text-slate-900">
                      {order.profiles?.full_name ?? order.profiles?.email ?? '-'}
                    </Td>
                    <Td>{formatCurrency(order.total)}</Td>
                    <Td>
                      <Badge tone={statusTone[order.status] ?? 'slate'}>{order.status}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDateTime(order.created_at)}</Td>
                    <Td>
                      <form action={updateOrderStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={order.id} />
                        <Select name="status" defaultValue={order.status} className="w-32 py-1 text-xs">
                          {allStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm" variant="secondary">
                          Save
                        </Button>
                      </form>
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
