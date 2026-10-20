import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';
import { NoticeMarquee } from '@/components/site/notice-marquee';
import { SiteHeaderBar } from '@/components/site-header-bar';
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
      <SiteHeaderBar
        isAuthenticated={Boolean(ctx)}
        name={name}
        avatarUrl={avatarUrl}
        dashboardHref={dashboardHref}
        initials={initials(name)}
      />
    </header>
  );
}
