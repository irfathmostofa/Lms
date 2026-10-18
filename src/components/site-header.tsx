import Link from 'next/link';
import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';
import { ButtonLink } from '@/components/ui';
import type { UserRole } from '@/lib/types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function SiteHeader() {
  const ctx = await getSessionContext();
  const role: UserRole = ctx?.profile?.role ?? 'student';
  const name = ctx?.profile?.full_name || ctx?.email || 'Account';
  const avatarUrl = ctx?.profile?.avatar_url ?? null;
  const dashboardHref = ROLE_HOME[role] ?? '/dashboard';

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-brand-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          L
        </span>
        <span className="hidden sm:inline">LMS Platform</span>
      </Link>

      <nav className="flex items-center gap-3">
        <Link href="/courses" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Courses
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
    </header>
  );
}
