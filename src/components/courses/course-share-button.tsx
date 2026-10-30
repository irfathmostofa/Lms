'use client';

import { useState } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';

export function CourseShareButton() {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800 underline-offset-2 hover:underline"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
        <path
          d="M6.2 8.8 9.8 6.2M6.5 4.2 8.2 2.5a2.4 2.4 0 1 1 3.3 3.3L9.8 7.5M9.5 11.8 7.8 13.5a2.4 2.4 0 1 1-3.3-3.3L6.2 8.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      {copied ? t('detail.copied') : t('detail.share')}
    </button>
  );
}
