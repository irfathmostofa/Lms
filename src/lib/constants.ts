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
  group: string;
  roles: UserRole[];
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', group: 'Overview', roles: ['admin'] },
  { href: '/dashboard/my-learning', label: 'My learning', group: 'Learning', roles: ['student'] },
  { href: '/dashboard/my-fees', label: 'My fees', group: 'Finance', roles: ['student'] },
  { href: '/dashboard/my-assessments', label: 'Assessments', group: 'Learning', roles: ['student'] },
  { href: '/dashboard/my-attendance', label: 'Attendance', group: 'Learning', roles: ['student'] },
  { href: '/dashboard/store', label: 'Store', group: 'Store', roles: ['student'] },
  { href: '/dashboard/users', label: 'Users', group: 'People', roles: ['admin'] },
  { href: '/dashboard/courses', label: 'Courses', group: 'Academics', roles: ['admin', 'editor', 'instructor'] },
  { href: '/dashboard/enrollments', label: 'Enrollments', group: 'People', roles: ['admin'] },
  { href: '/dashboard/batches', label: 'Batches', group: 'Academics', roles: ['admin', 'instructor'] },
  { href: '/dashboard/attendance', label: 'Attendance', group: 'Academics', roles: ['admin', 'instructor'] },
  { href: '/dashboard/assessments', label: 'Assessments', group: 'Academics', roles: ['admin', 'instructor'] },
  { href: '/dashboard/content', label: 'Content', group: 'Academics', roles: ['admin', 'editor'] },
  { href: '/dashboard/payments', label: 'Payments', group: 'Finance', roles: ['admin', 'accountant'] },
  { href: '/dashboard/finance', label: 'Finance', group: 'Finance', roles: ['admin', 'accountant'] },
  { href: '/dashboard/orders', label: 'Orders', group: 'Finance', roles: ['admin'] },
  { href: '/dashboard/hero', label: 'Hero slider', group: 'Website', roles: ['admin'] },
  { href: '/dashboard/notices', label: 'Notices', group: 'Website', roles: ['admin'] },
  { href: '/dashboard/about', label: 'About page', group: 'Website', roles: ['admin'] },
  { href: '/dashboard/website', label: 'Home & about', group: 'Website', roles: ['admin'] },
  { href: '/dashboard/settings', label: 'Settings', group: 'Account', roles: ['admin'] },
];

export function navForRole(role: UserRole): NavItem[] {
  return DASHBOARD_NAV.filter((item) => item.roles.includes(role));
}
