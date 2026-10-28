'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Card, CardBody, EmptyState } from '@/components/ui';
import { claimFreeResourceAction, placeOrderAction } from '@/actions/student';
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

function ClaimButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Unlocking...' : 'Get free access'}
    </Button>
  );
}

export function StoreGrid({
  products,
  accessIds,
  fileUrls = {},
}: {
  products: Product[];
  accessIds: string[];
  fileUrls?: Record<string, string>;
}) {
  const [orderState, orderAction] = useFormState(placeOrderAction, null);
  const [claimState, claimAction] = useFormState(claimFreeResourceAction, null);
  const [cart, setCart] = useState<string[]>([]);
  const accessSet = new Set(accessIds);
  const notices = [claimState, orderState].filter(Boolean);

  const inCart = (id: string) => cart.includes(id);
  const toggle = (id: string) =>
    setCart((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  if (products.length === 0) {
    return <EmptyState title="No resources yet" description="Check back soon." />;
  }

  return (
    <div className="space-y-6">
      {notices.map((notice, index) =>
        notice?.error ? (
          <p key={`error-${index}`} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {notice.error}
          </p>
        ) : notice?.success ? (
          <p key={`success-${index}`} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice.success}
          </p>
        ) : null,
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const owned = accessSet.has(product.id);
          const fileUrl = fileUrls[product.id];
          const isFree = Number(product.price) <= 0;
          return (
            <Card key={product.id}>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {product.type === 'physical' ? 'printed' : 'digital'}
                  </span>
                  {owned ? <span className="text-xs text-emerald-600">Owned</span> : null}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{product.name}</h3>
                <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
                <p className="text-sm font-semibold text-brand-700">
                  {isFree ? 'Free' : formatCurrency(product.price)}
                </p>
                {product.type === 'physical' ? (
                  <p className="text-xs text-slate-400">{product.stock} in stock</p>
                ) : null}
                {owned ? (
                  product.type === 'digital' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/store/${product.id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700"
                      >
                        Read PDF
                      </Link>
                      {fileUrl ? (
                        <a
                          href={fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Download
                        </a>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          No file
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Ships after payment
                    </Button>
                  )
                ) : isFree && product.type === 'digital' ? (
                  <form action={claimAction}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <ClaimButton />
                  </form>
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
            <form action={orderAction} className="space-y-3">
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
