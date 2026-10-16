import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/auth';
import { navForRole, ROLE_LABEL } from '@/lib/constants';
import { NavLinks } from '@/components/dashboard/nav-links';
import { LogoutButton } from '@/components/logout-button';
import { Badge } from '@/components/ui';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const role = ctx.profile?.role ?? 'student';
  const items = navForRole(role);
  const name = ctx.profile?.full_name ?? ctx.email ?? 'Account';

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-base font-semibold text-brand-700">
            LMS Platform
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 lg:hidden">
            Site
          </Link>
        </div>
        <div className="px-3 pb-6">
          <NavLinks items={items} />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-400">{ctx.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="blue">{ROLE_LABEL[role]}</Badge>
            <LogoutButton />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
