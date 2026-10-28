'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Card, CardBody, EmptyState } from '@/components/ui';
import { claimFreeResourceAction } from '@/actions/student';
import { useCart } from '@/lib/cart';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';

function ClaimButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Unlocking...' : 'Get free access'}
    </Button>
  );
}

function typeLabel(type: Product['type']) {
  return type === 'physical' ? 'printed / tool' : 'digital';
}

export function StoreGrid({
  products,
  accessIds,
}: {
  products: Product[];
  accessIds: string[];
}) {
  const [claimState, claimAction] = useFormState(claimFreeResourceAction, null);
  const cart = useCart();
  const accessSet = new Set(accessIds);

  if (products.length === 0) {
    return <EmptyState title="No products yet" description="Check back soon." />;
  }

  return (
    <div className="space-y-6">
      {claimState?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{claimState.error}</p>
      ) : null}
      {claimState?.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{claimState.success}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const owned = accessSet.has(product.id);
          const isFree = Number(product.price) <= 0;
          const inCart = cart.has(product.id);
          return (
            <Card key={product.id}>
              <CardBody className="space-y-3">
                <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-100">
                  {product.thumbnail_url ? (
                    <Image
                      src={product.thumbnail_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {typeLabel(product.type)}
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
                    <Link
                      href="/dashboard/downloads"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-700"
                    >
                      Open in Downloads
                    </Link>
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
                    variant={inCart ? 'secondary' : 'primary'}
                    className="w-full"
                    onClick={() => cart.toggle(product.id)}
                  >
                    {inCart ? 'Remove from cart' : 'Add to cart'}
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {cart.ids.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-700">
            {cart.ids.length} item{cart.ids.length > 1 ? 's' : ''} in cart
          </p>
          <Link
            href="/dashboard/cart"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Go to cart
          </Link>
        </div>
      ) : null}
    </div>
  );
}
