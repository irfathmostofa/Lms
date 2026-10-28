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

  const [productsRes, accessRes, ordersRes, methods, settings] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('product_access').select('product_id').eq('user_id', ctx.userId),
    supabase
      .from('orders')
      .select('id, order_no, status, total')
      .eq('user_id', ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1),
    getPaymentMethods(),
    getPublicSettings(['payment_instructions']),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const accessIds = ((accessRes.data as { product_id: string }[]) ?? []).map((row) => row.product_id);
  const pending = ((ordersRes.data as PendingOrder[]) ?? []).find((order) => Number(order.total) > 0) ?? null;

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
