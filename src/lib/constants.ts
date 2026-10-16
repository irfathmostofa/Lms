import type { UserRole } from './types';

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  accountant: 'Accountant',
  instructor: 'Instructor',
  editor: 'Editor',
  student: 'Student',
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/dashboard',
  accountant: '/dashboard/finance',
  instructor: '/dashboard/instructor',
  editor: '/dashboard/content',
  student: '/dashboard/my-learning',
};

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', roles: ['admin'] },
  { href: '/dashboard/my-learning', label: 'My Learning', roles: ['student'] },
  { href: '/dashboard/my-fees', label: 'My Fees', roles: ['student'] },
  { href: '/dashboard/my-assessments', label: 'Assessments', roles: ['student'] },
  { href: '/dashboard/my-attendance', label: 'Attendance', roles: ['student'] },
  { href: '/dashboard/store', label: 'Store', roles: ['student'] },
  { href: '/dashboard/users', label: 'Users', roles: ['admin'] },
  { href: '/dashboard/courses', label: 'Courses', roles: ['admin', 'editor', 'instructor'] },
  { href: '/dashboard/enrollments', label: 'Enrollments', roles: ['admin'] },
  { href: '/dashboard/batches', label: 'Batches', roles: ['admin', 'instructor'] },
  { href: '/dashboard/assessments', label: 'Assessments', roles: ['admin', 'instructor'] },
  { href: '/dashboard/content', label: 'Content', roles: ['admin', 'editor'] },
  { href: '/dashboard/payments', label: 'Payments', roles: ['admin', 'accountant'] },
  { href: '/dashboard/finance', label: 'Finance', roles: ['admin', 'accountant'] },
  { href: '/dashboard/orders', label: 'Orders', roles: ['admin'] },
  { href: '/dashboard/settings', label: 'Settings', roles: ['admin'] },
];

export function navForRole(role: UserRole): NavItem[] {
  return DASHBOARD_NAV.filter((item) => item.roles.includes(role));
}
