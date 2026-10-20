'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { Testimonial } from '@/lib/types';

const PAGE = 3;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5`}>
      {'★'.repeat(Math.max(1, Math.min(5, rating)))}
      <span className="text-slate-200">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

export function TestimonialCarousel({
  testimonials,
  title = 'What learners say',
  eyebrow = 'Reviews',
}: {
  testimonials: Testimonial[];
  title?: string;
  eyebrow?: string;
}) {
  const pages = useMemo(() => {
    if (testimonials.length === 0) return [];
    const chunks: Testimonial[][] = [];
    for (let i = 0; i < testimonials.length; i += PAGE) chunks.push(testimonials.slice(i, i + PAGE));
    return chunks;
  }, [testimonials]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pages.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % pages.length), 6000);
    return () => window.clearInterval(timer);
  }, [pages.length]);

  if (pages.length === 0) return null;

  const page = pages[index] ?? pages[0];

  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {page.map((item) => (
            <article key={item.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Stars rating={item.rating} />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">“{item.quote}”</p>
              <div className="mt-5 flex items-center gap-3">
                {item.avatar_url ? (
                  <Image
                    src={item.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {item.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  {item.role_title ? <p className="text-xs text-slate-500">{item.role_title}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
        {pages.length > 1 ? (
          <div className="mt-6 flex justify-center gap-2">
            {pages.map((_, pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                aria-label={`Reviews page ${pageIndex + 1}`}
                onClick={() => setIndex(pageIndex)}
                className={`h-2.5 w-2.5 rounded-full ${pageIndex === index ? 'bg-brand-600' : 'bg-slate-300'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
