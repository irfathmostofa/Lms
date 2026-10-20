'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { Partner } from '@/lib/types';

const PAGE = 3;

export function LogoCarousel({
  partners,
  title = 'Trusted by partners',
  eyebrow = 'Partners',
}: {
  partners: Partner[];
  title?: string;
  eyebrow?: string;
}) {
  const pages = useMemo(() => {
    if (partners.length === 0) return [];
    const chunks: Partner[][] = [];
    for (let i = 0; i < partners.length; i += PAGE) chunks.push(partners.slice(i, i + PAGE));
    return chunks;
  }, [partners]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pages.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % pages.length), 5000);
    return () => window.clearInterval(timer);
  }, [pages.length]);

  if (pages.length === 0) return null;

  const page = pages[index] ?? pages[0];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {page.map((partner) => {
            const inner = (
              <div className="flex h-28 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                {partner.logo_url ? (
                  <Image
                    src={partner.logo_url}
                    alt={partner.name}
                    width={180}
                    height={64}
                    className="max-h-16 w-auto object-contain"
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-600">{partner.name}</span>
                )}
              </div>
            );
            return partner.href ? (
              <a key={partner.id} href={partner.href} target="_blank" rel="noreferrer" className="block">
                {inner}
              </a>
            ) : (
              <div key={partner.id}>{inner}</div>
            );
          })}
        </div>
        {pages.length > 1 ? (
          <div className="mt-6 flex justify-center gap-2">
            {pages.map((_, pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                aria-label={`Partners page ${pageIndex + 1}`}
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
