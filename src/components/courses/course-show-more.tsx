'use client';

import { useState, type ReactNode } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';
import { cn } from '@/lib/utils';

export function CourseShowMore({
  children,
  collapsedClassName = 'max-h-56',
}: {
  children: ReactNode;
  collapsedClassName?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className={cn('relative overflow-hidden', !open && collapsedClassName)}>
        {children}
        {!open ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
      >
        {open ? t('detail.showLess') : t('detail.showMore')}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')}
          fill="none"
        >
          <path d="M3.5 6.2 8 10.5l4.5-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
