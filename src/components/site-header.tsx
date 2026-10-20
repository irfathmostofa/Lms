import Link from 'next/link';
import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';
import { ButtonLink } from '@/components/ui';
import { NoticeMarquee } from '@/components/site/notice-marquee';
import { CourseSearch } from '@/components/courses/course-search';
import { getActiveNotices } from '@/lib/website';
import type { UserRole } from '@/lib/types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function SiteHeader() {
  const [ctx, notices] = await Promise.all([getSessionContext(), getActiveNotices()]);
  const role: UserRole = ctx?.profile?.role ?? 'student';
  const name = ctx?.profile?.full_name || ctx?.email || 'Account';
  const avatarUrl = ctx?.profile?.avatar_url ?? null;
  const dashboardHref = ROLE_HOME[role] ?? '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <NoticeMarquee notices={notices} />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3.5 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            L
          </span>
          <span className="hidden sm:inline">LMS Platform</span>
        </Link>

        <CourseSearch inputId="course-search-header" className="hidden max-w-md flex-1 md:block" />

        <nav className="flex items-center gap-3">
          <Link href="/courses" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Courses
          </Link>
          <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            About
          </Link>

          {ctx ? (
            <Link
              href={dashboardHref}
              aria-label={`${name} dashboard`}
              className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials(name)}
                </span>
              )}
              <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:inline">
                {name}
              </span>
            </Link>
          ) : (
            <>
              <ButtonLink href="/login" variant="outline" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
      <div className="border-t border-slate-100 px-6 py-2 md:hidden">
        <CourseSearch inputId="course-search-header-mobile" className="mx-auto max-w-6xl" />
      </div>
    </header>
  );
}
