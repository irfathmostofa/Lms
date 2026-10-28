import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Card, CardBody, CardHeader, EmptyState, PageHeader, Table, Td, Th, Badge } from '@/components/ui';
import { StoreGrid } from '@/components/dashboard/store-grid';
import { ManualPaymentForm } from '@/components/dashboard/manual-payment-form';
import { getPaymentMethods, getPublicSettings } from '@/lib/data';
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

interface ProductFileRow {
  product_id: string;
  file_url: string;
  title: string;
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

  const [productsRes, accessRes, ordersRes, filesRes, methods, settings] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('product_access').select('product_id').eq('user_id', ctx.userId),
    supabase
      .from('orders')
      .select('id, order_no, status, total, created_at')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('product_files').select('product_id, file_url, title'),
    getPaymentMethods(),
    getPublicSettings(['payment_instructions']),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const accessIds = ((accessRes.data as { product_id: string }[]) ?? []).map((row) => row.product_id);
  const orders = (ordersRes.data as OrderRow[]) ?? [];
  const files = (filesRes.data as ProductFileRow[]) ?? [];
  const fileUrls = Object.fromEntries(files.map((row) => [row.product_id, row.file_url]));
  const accessSet = new Set(accessIds);
  const owned = products.filter((product) => accessSet.has(product.id));
  const pendingOrder = orders.find((order) => order.status === 'pending' && Number(order.total) > 0);

  return (
    <>
      <PageHeader
        title="Store"
        description="Free digital resources unlock immediately. Paid PDFs unlock after verified payment. Printed books ship to your address."
      />

      {owned.length > 0 ? (
        <Card className="mb-6">
          <CardHeader
            title="My resources"
            description="Purchased PDFs can be read online or downloaded."
          />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Resource</Th>
                  <Th>Type</Th>
                  <Th>File</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owned.map((product) => {
                  const fileUrl = fileUrls[product.id];
                  return (
                    <tr key={product.id}>
                      <Td className="font-medium text-slate-900">{product.name}</Td>
                      <Td>
                        <Badge>{product.type === 'physical' ? 'printed' : 'digital'}</Badge>
                      </Td>
                      <Td>
                        {product.type === 'physical' ? (
                          <span className="text-xs text-slate-500">Ships after payment</span>
                        ) : fileUrl ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={`/dashboard/store/${product.id}`}
                              className="text-sm font-medium text-brand-600 hover:underline"
                            >
                              Read PDF
                            </Link>
                            <a
                              href={fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-slate-600 hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">File not attached yet</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      <StoreGrid products={products} accessIds={accessIds} fileUrls={fileUrls} />

      {pendingOrder ? (
        <Card className="mt-6">
          <CardHeader
            title={`Pay order ${pendingOrder.order_no}`}
            description={
              settings.payment_instructions ??
              'Send the amount, then submit method and TrxID. Access unlocks when an admin verifies it.'
            }
          />
          <CardBody>
            <div className="max-w-md">
              <ManualPaymentForm
                orderId={pendingOrder.id}
                methods={methods}
                suggestedAmount={Number(pendingOrder.total)}
              />
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader
          title="My orders"
          description="Paid digital orders grant download access automatically."
        />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No orders yet" description="Add a resource to your cart or claim a free one." />
            </div>
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
                    <Td>{Number(order.total) > 0 ? formatCurrency(order.total) : 'Free'}</Td>
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
