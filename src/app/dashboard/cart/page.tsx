import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import { CartCheckout } from '@/components/dashboard/cart-checkout';
import { getPaymentMethods, getPublicSettings } from '@/lib/data';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PendingOrder {
  id: string;
  order_no: string;
  total: number;
  status: string;
}

export default async function CartPage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [productsRes, accessRes, ordersRes, paymentsRes, methods, settings] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('product_access').select('product_id').eq('user_id', ctx.userId),
    supabase
      .from('orders')
      .select('id, order_no, status, total')
      .eq('user_id', ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('payments')
      .select('order_id, status')
      .eq('student_id', ctx.userId)
      .in('status', ['pending', 'verified']),
    getPaymentMethods(),
    getPublicSettings(['payment_instructions']),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const accessIds = ((accessRes.data as { product_id: string }[]) ?? []).map((row) => row.product_id);
  const submittedOrderIds = new Set(
    ((paymentsRes.data as { order_id: string | null; status: string }[]) ?? [])
      .filter((row) => row.order_id)
      .map((row) => row.order_id as string),
  );
  const pending =
    ((ordersRes.data as PendingOrder[]) ?? []).find(
      (order) => Number(order.total) > 0 && !submittedOrderIds.has(order.id),
    ) ?? null;

  return (
    <>
      <PageHeader
        title="Cart"
        description="Checkout every selected product in one payment. Printed books and tools need a shipping address."
      />
      <CartCheckout
        products={products}
        accessIds={accessIds}
        methods={methods}
        paymentInstructions={settings.payment_instructions}
        pendingOrder={pending}
      />
    </>
  );
}
