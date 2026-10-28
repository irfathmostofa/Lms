import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Table, Td, Th } from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface OrderRow {
  id: string;
  order_no: string;
  status: string;
  total: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  created_at: string;
}

interface ProductFileRow {
  product_id: string;
  file_url: string;
  title: string;
}

interface OrderItemRow {
  product_id: string;
  product_name: string;
  order_id: string;
}

const statusTone: Record<string, 'amber' | 'green' | 'violet' | 'slate' | 'red'> = {
  pending: 'amber',
  paid: 'green',
  shipped: 'violet',
  delivered: 'green',
  cancelled: 'red',
};

export default async function DownloadsPage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [productsRes, accessRes, ordersRes, filesRes] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('product_access').select('product_id').eq('user_id', ctx.userId),
    supabase
      .from('orders')
      .select('id, order_no, status, total, shipping_name, shipping_phone, shipping_address, created_at')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('product_files').select('product_id, file_url, title'),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const accessIds = new Set(((accessRes.data as { product_id: string }[]) ?? []).map((row) => row.product_id));
  const digital = products.filter((product) => product.type === 'digital' && accessIds.has(product.id));
  const orders = (ordersRes.data as OrderRow[]) ?? [];
  const files = (filesRes.data as ProductFileRow[]) ?? [];
  const fileUrls = Object.fromEntries(files.map((row) => [row.product_id, row.file_url]));

  const shippableStatuses = new Set(['paid', 'processing', 'shipped', 'delivered']);
  const paidOrderIds = orders.filter((order) => shippableStatuses.has(order.status)).map((order) => order.id);
  const { data: itemData } =
    paidOrderIds.length > 0
      ? await supabase.from('order_items').select('product_id, product_name, order_id').in('order_id', paidOrderIds)
      : { data: [] as OrderItemRow[] };
  const productById = new Map(products.map((product) => [product.id, product]));
  const physical = ((itemData as OrderItemRow[]) ?? []).filter((item) => {
    const product = productById.get(item.product_id);
    return product?.type === 'physical';
  });

  return (
    <>
      <PageHeader
        title="Downloads"
        description="Verified digital purchases appear here. Printed books and tools ship to the address you submitted."
      />

      <Card className="mb-6">
        <CardHeader title="Digital files" description="Available after payment is verified." />
        <CardBody className="p-0">
          {digital.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No files yet"
                description="Buy from the store and submit payment. Files unlock here after verification."
              />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>File</Th>
                  <Th>Access</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {digital.map((product) => {
                  const fileUrl = fileUrls[product.id];
                  return (
                    <tr key={product.id}>
                      <Td className="font-medium text-slate-900">{product.name}</Td>
                      <Td>
                        {fileUrl ? (
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
          )}
        </CardBody>
      </Card>

      {physical.length > 0 ? (
        <Card className="mb-6">
          <CardHeader title="Printed and tools" description="These ship to the address on your paid order." />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Item</Th>
                  <Th>Order</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {physical.map((item) => {
                  const order = orders.find((row) => row.id === item.order_id);
                  return (
                    <tr key={`${item.order_id}-${item.product_id}`}>
                      <Td className="font-medium text-slate-900">{item.product_name}</Td>
                      <Td>
                        <span className="text-xs text-slate-500">
                          {order ? `${order.order_no} · ${order.status}` : 'Paid'}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="My orders" description="One payment covers every product in that order." />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No orders yet" description="Add products in the store, then checkout from Cart." />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Order</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Ship to</Th>
                  <Th>Placed</Th>
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
                    <Td className="max-w-xs text-xs text-slate-500">
                      {order.shipping_address
                        ? `${order.shipping_name ?? ''} · ${order.shipping_phone ?? ''} · ${order.shipping_address}`
                        : 'Digital only'}
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDateTime(order.created_at)}</Td>
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
