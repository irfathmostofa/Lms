import Link from 'next/link';
import type { SiteNotice } from '@/lib/types';

export function NoticeMarquee({ notices }: { notices: SiteNotice[] }) {
  if (notices.length === 0) return null;

  const items = [...notices, ...notices];

  return (
    <div className="bg-slate-950 text-white">
      <div className="notice-marquee" aria-label="Site notices">
        <div className="notice-marquee-track">
          {items.map((notice, index) => {
            const content = (
              <span className="inline-flex items-center gap-2 px-8 text-sm font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                {notice.message}
              </span>
            );
            return notice.href ? (
              <Link key={`${notice.id}-${index}`} href={notice.href} className="shrink-0 hover:underline">
                {content}
              </Link>
            ) : (
              <span key={`${notice.id}-${index}`} className="shrink-0">
                {content}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
