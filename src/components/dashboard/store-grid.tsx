'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Card, CardBody, EmptyState } from '@/components/ui';
import { placeOrderAction } from '@/actions/student';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';

function CheckoutButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? 'Placing order...' : 'Place order'}
    </Button>
  );
}

export function StoreGrid({
  products,
  accessIds,
}: {
  products: Product[];
  accessIds: string[];
}) {
  const [state, formAction] = useFormState(placeOrderAction, null);
  const [cart, setCart] = useState<string[]>([]);
  const accessSet = new Set(accessIds);

  const inCart = (id: string) => cart.includes(id);
  const toggle = (id: string) =>
    setCart((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  if (products.length === 0) {
    return <EmptyState title="No products yet" description="Check back soon." />;
  }

  return (
    <div className="space-y-6">
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const owned = accessSet.has(product.id);
          return (
            <Card key={product.id}>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {product.type}
                  </span>
                  {owned ? <span className="text-xs text-emerald-600">Owned</span> : null}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{product.name}</h3>
                <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
                <p className="text-sm font-semibold text-brand-700">
                  {formatCurrency(product.price)}
                </p>
                {product.type === 'physical' ? (
                  <p className="text-xs text-slate-400">{product.stock} in stock</p>
                ) : null}
                {owned ? (
                  <Button variant="outline" className="w-full" disabled>
                    Access available
                  </Button>
                ) : (
                  <Button
                    variant={inCart(product.id) ? 'secondary' : 'primary'}
                    className="w-full"
                    onClick={() => toggle(product.id)}
                  >
                    {inCart(product.id) ? 'Remove from cart' : 'Add to cart'}
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {cart.length > 0 ? (
        <Card>
          <CardBody>
            <form action={formAction} className="space-y-3">
              {cart.map((id) => (
                <input key={id} type="hidden" name="product_id" value={id} />
              ))}
              <p className="text-sm text-slate-700">
                {cart.length} item{cart.length > 1 ? 's' : ''} in cart.
              </p>
              <div className="max-w-xs">
                <CheckoutButton disabled={cart.length === 0} />
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
