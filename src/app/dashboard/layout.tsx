import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/auth';
import { navForRole, ROLE_LABEL } from '@/lib/constants';
import { DashboardChrome } from '@/components/dashboard/dashboard-chrome';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const role = ctx.profile?.role ?? 'student';
  const items = navForRole(role);
  const name = ctx.profile?.full_name ?? ctx.email ?? 'Account';
  const email = ctx.email ?? '';

  return (
    <DashboardChrome
      items={items}
      name={name}
      email={email}
      roleLabel={ROLE_LABEL[role]}
      showSiteLink={role === 'admin'}
    >
      {children}
    </DashboardChrome>
  );
}
