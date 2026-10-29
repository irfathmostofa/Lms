'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Textarea } from '@/components/ui';
import { Modal } from '@/components/dashboard/modal';
import { ManualPaymentForm } from '@/components/dashboard/manual-payment-form';
import { placeOrderAction } from '@/actions/student';
import { clearCart, useCart } from '@/lib/cart';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';

function CheckoutButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? 'Placing order...' : 'Place order and pay'}
    </Button>
  );
}

export function CartCheckout({
  products,
  accessIds,
  methods,
  paymentInstructions,
  pendingOrder,
}: {
  products: Product[];
  accessIds: string[];
  methods: { code: string; label: string }[];
  paymentInstructions: string | null;
  pendingOrder: { id: string; order_no: string; total: number } | null;
}) {
  const router = useRouter();
  const { ids, ready, remove, clear } = useCart();
  const [orderState, orderAction] = useFormState(placeOrderAction, null);
  const [payOpen, setPayOpen] = useState(false);
  const [payOrder, setPayOrder] = useState<{ id: string; total: number } | null>(null);
  const [paid, setPaid] = useState(false);

  const accessSet = useMemo(() => new Set(accessIds), [accessIds]);
  const items = useMemo(
    () =>
      paid
        ? []
        : products.filter((product) => ids.includes(product.id) && !accessSet.has(product.id)),
    [products, ids, accessSet, paid],
  );

  const handlePaid = useCallback(() => {
    clearCart();
    clear();
    setPaid(true);
    setPayOpen(false);
    router.refresh();
  }, [clear, router]);

  useEffect(() => {
    if (!orderState?.payNow || !orderState.orderId) return;
    setPayOrder({ id: orderState.orderId, total: Number(orderState.total ?? 0) });
    setPayOpen(true);
  }, [orderState]);

  const subtotal = items.reduce((sum, product) => sum + Number(product.price), 0);
  const needsShipping = items.some((product) => product.type === 'physical');

  if (!ready) {
    return <EmptyState title="Loading cart..." />;
  }

  if (items.length === 0 && !pendingOrder && !payOpen && !orderState?.success && !paid) {
    return (
      <EmptyState
        title="Cart is empty"
        description="Add products from the store. You can pay for several items in one checkout."
      />
    );
  }

  return (
    <div className="space-y-6">
      {orderState?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{orderState.error}</p>
      ) : null}
      {paid ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Payment submitted. Digital files appear on Downloads after verification.{' '}
          <Link href="/dashboard/downloads" className="font-medium underline">
            Open Downloads
          </Link>
        </p>
      ) : null}
      {orderState?.success && !orderState.payNow ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {orderState.success}{' '}
          <Link href="/dashboard/downloads" className="font-medium underline">
            Open Downloads
          </Link>
        </p>
      ) : null}

      {items.length > 0 ? (
        <Card>
          <CardHeader
            title="Cart items"
            description="Pay for every selected product in a single payment."
          />
          <CardBody className="space-y-4">
            <ul className="divide-y divide-slate-100">
              {items.map((product) => (
                <li key={product.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {product.type === 'physical' ? 'printed / tool' : 'digital'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {Number(product.price) > 0 ? formatCurrency(product.price) : 'Free'}
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={() => remove(product.id)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-500">{items.length} item{items.length > 1 ? 's' : ''}</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(subtotal)}</p>
            </div>

            <form action={orderAction} className="space-y-3">
              {items.map((product) => (
                <input key={product.id} type="hidden" name="product_id" value={product.id} />
              ))}

              {needsShipping ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <p className="text-sm font-medium text-slate-800 sm:col-span-2">
                    Shipping address for printed resources and tools
                  </p>
                  <Field label="Full name">
                    <Input name="shipping_name" required placeholder="Your name" />
                  </Field>
                  <Field label="Phone">
                    <Input name="shipping_phone" required placeholder="01XXXXXXXXX" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Delivery address">
                      <Textarea name="shipping_address" required placeholder="House, road, area, district" />
                    </Field>
                  </div>
                </div>
              ) : null}

              <CheckoutButton disabled={items.length === 0} />
            </form>
          </CardBody>
        </Card>
      ) : null}

      {pendingOrder && !paid ? (
        <Card>
          <CardHeader
            title={`Unpaid order ${pendingOrder.order_no}`}
            description="Submit payment for this order. Digital files unlock on Downloads after verification."
          />
          <CardBody>
            <Button
              type="button"
              onClick={() => {
                setPayOrder({ id: pendingOrder.id, total: Number(pendingOrder.total) });
                setPayOpen(true);
              }}
            >
              Pay {formatCurrency(pendingOrder.total)}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <p className="text-xs text-slate-500">
        Need more products?{' '}
        <Link href="/dashboard/store" className="font-medium text-brand-600 hover:underline">
          Back to store
        </Link>
      </p>

      <Modal
        open={payOpen}
        title="Pay for this order"
        description={
          paymentInstructions ??
          'Send the total once for every item in this cart, then submit method and TrxID.'
        }
        onClose={() => setPayOpen(false)}
      >
        {payOrder ? (
          <ManualPaymentForm
            orderId={payOrder.id}
            methods={methods}
            suggestedAmount={payOrder.total}
            onSuccess={handlePaid}
          />
        ) : null}
      </Modal>
    </div>
  );
}
