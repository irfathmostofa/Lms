import Link from 'next/link';
import type { HomeProduct } from '@/lib/home';
import { formatCurrency } from '@/lib/utils';

function ResourceIcon({ type }: { type: string }) {
  if (type === 'physical') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path
          d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15zM4 20.5A2.5 2.5 0 016.5 18H20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path
        d="M7 3.5h7L19 8v12.5H7a2 2 0 01-2-2v-13a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const tones = [
  'bg-brand-50 text-brand-600 ring-brand-100',
  'bg-emerald-50 text-emerald-600 ring-emerald-100',
  'bg-violet-50 text-violet-600 ring-violet-100',
  'bg-amber-50 text-amber-600 ring-amber-100',
];

export function HomeResources({ products }: { products: HomeProduct[] }) {
  return (
    <section id="resources" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">
              Learning resources
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Tools and guides that go beyond lessons
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Downloadable handbooks, templates and workbooks designed to help you apply what you
              learn.
            </p>
          </div>
          <Link
            href="/dashboard/store"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          >
            Browse the store
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-700">Resources are on the way</p>
            <p className="mt-1 text-sm text-slate-500">
              New guides and templates will appear here as soon as they are published.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href="/dashboard/store"
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ${
                      tones[index % tones.length]
                    }`}
                  >
                    <ResourceIcon type={product.type} />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">
                    {product.type === 'physical' ? 'Printed' : 'Digital'}
                  </span>
                </div>
                <h3 className="mt-4 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                  {product.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                  {product.description ?? 'A practical resource to support your learning.'}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="text-sm font-bold text-slate-900">
                    {Number(product.price) > 0 ? formatCurrency(product.price) : 'Free'}
                  </span>
                  <span className="text-xs font-semibold text-brand-600 group-hover:underline">
                    View details
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
