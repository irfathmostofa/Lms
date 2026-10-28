import { getSessionContext } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';
import { NoticeMarquee } from '@/components/site/notice-marquee';
import { SiteHeaderBar } from '@/components/site-header-bar';
import { FloatingActions } from '@/components/site/floating-actions';
import { getPublicSettings } from '@/lib/data';
import { getActiveNotices } from '@/lib/website';
import { getRequestLocale } from '@/lib/locale';
import { whatsappHref } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function SiteHeader() {
  const [ctx, notices, settings] = await Promise.all([
    getSessionContext(),
    getActiveNotices(),
    getPublicSettings(['site_name', 'support_whatsapp', 'support_phone']),
  ]);
  const locale = getRequestLocale();
  const role: UserRole = ctx?.profile?.role ?? 'student';
  const name = ctx?.profile?.full_name || ctx?.email || 'Account';
  const avatarUrl = ctx?.profile?.avatar_url ?? null;
  const dashboardHref = ROLE_HOME[role] ?? '/dashboard';
  const siteName = settings.site_name ?? 'LMS Platform';
  const chatHref = whatsappHref(
    settings.support_whatsapp || settings.support_phone,
    locale === 'bn'
      ? `হ্যালো ${siteName}, আমার একটি কোর্স নিয়ে সাহায্য দরকার।`
      : `Hello ${siteName}, I need help with a course.`,
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 text-slate-900 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <NoticeMarquee notices={notices} />
        <SiteHeaderBar
          siteName={siteName}
          isAuthenticated={Boolean(ctx)}
          name={name}
          avatarUrl={avatarUrl}
          dashboardHref={dashboardHref}
          initials={initials(name)}
          locale={locale}
        />
      </header>
      <FloatingActions whatsappHref={chatHref} />
    </>
  );
}
