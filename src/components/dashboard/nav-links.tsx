'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';

function groupItems(items: NavItem[]) {
  const groups = new Map<string, NavItem[]>();
  items.forEach((item) => {
    const group = groups.get(item.group);
    if (group) {
      group.push(item);
    } else {
      groups.set(item.group, [item]);
    }
  });
  return Array.from(groups.entries());
}

export function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = groupItems(items);

  return (
    <nav aria-label="Dashboard" className="space-y-5">
      {groups.map(([group, groupItems]) => (
        <div key={group}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {group}
          </p>
          <div className="space-y-1">
            {groupItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      active ? 'bg-brand-500' : 'bg-slate-300',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
