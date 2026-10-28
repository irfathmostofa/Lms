'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <form action="/api/locale" method="post" className="inline-flex items-center">
      <input type="hidden" name="next" value={pathname || '/'} />
      <input type="hidden" name="locale" value={locale === 'bn' ? 'en' : 'bn'} />
      <button
        type="submit"
        aria-label={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
        className={cn(
          'inline-flex min-h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
          compact ? 'min-w-[4.5rem]' : 'min-w-[5.25rem]',
        )}
      >
        {locale === 'bn' ? 'English' : 'বাংলা'}
      </button>
    </form>
  );
}
