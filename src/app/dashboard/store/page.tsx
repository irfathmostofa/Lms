import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Card, CardBody, CardHeader, PageHeader, Table, Td, Th, Badge } from '@/components/ui';
import { StoreGrid } from '@/components/dashboard/store-grid';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface OrderRow {
  id: string;
  order_no: string;
  status: string;
  total: number;
  created_at: string;
}

const statusTone: Record<string, 'amber' | 'green' | 'violet' | 'slate' | 'red'> = {
  pending: 'amber',
  paid: 'green',
  shipped: 'violet',
  delivered: 'green',
  cancelled: 'red',
};

export default async function StorePage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [productsRes, accessRes, ordersRes] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('product_access').select('product_id').eq('user_id', ctx.userId),
    supabase
      .from('orders')
      .select('id, order_no, status, total, created_at')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const accessIds = ((accessRes.data as { product_id: string }[]) ?? []).map((row) => row.product_id);
  const orders = (ordersRes.data as OrderRow[]) ?? [];

  return (
    <>
      <PageHeader
        title="Store"
        description="Digital PDFs unlock after verified payment. Physical books ship to your address."
      />

      <StoreGrid products={products} accessIds={accessIds} />

      <Card className="mt-6">
        <CardHeader title="My orders" description="Pay via the My fees page or the link below." />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No orders yet.</div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Order</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <Td className="font-mono text-xs">{order.order_no}</Td>
                    <Td>{formatCurrency(order.total)}</Td>
                    <Td>
                      <Badge tone={statusTone[order.status] ?? 'slate'}>{order.status}</Badge>
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
