'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { NavItem } from '@/lib/constants';
import { NavLinks } from '@/components/dashboard/nav-links';
import { LogoutButton } from '@/components/logout-button';
import { Badge } from '@/components/ui';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onClick}
      className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        L
      </span>
      <span className="truncate text-base font-semibold text-slate-900">LMS Platform</span>
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardChrome({
  items,
  name,
  email,
  roleLabel,
  showSiteLink = false,
  children,
}: {
  items: NavItem[];
  name: string;
  email: string;
  roleLabel: string;
  showSiteLink?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isClassroom = /^\/dashboard\/my-learning\/[^/]+$/.test(pathname);
  const isPdfReader = /^\/dashboard\/store\/[^/]+$/.test(pathname);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  function closeDrawer() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  if (isClassroom || isPdfReader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <a
        href="#dashboard-main"
        className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <aside
        aria-hidden={open || undefined}
        className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col"
      >
        <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <NavLinks items={items} />
        </div>
        <div className="shrink-0 border-t border-slate-100 p-4">
          <p className="truncate text-sm font-medium text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Badge tone="blue">{roleLabel}</Badge>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div aria-hidden={open || undefined} className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={open}
                aria-controls="dashboard-mobile-nav"
                className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
              >
                <MenuIcon />
              </button>
              <div className="min-w-0 lg:hidden">
                <Brand />
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {showSiteLink ? (
                <Link
                  href="/"
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <ExternalIcon />
                  <span className="hidden sm:inline">View site</span>
                </Link>
              ) : null}
              <Badge tone="blue" className="hidden sm:inline-flex">
                {roleLabel}
              </Badge>
              <div className="hidden lg:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        <main
          id="dashboard-main"
          className="min-w-0 scroll-mt-20 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-900/50"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="dashboard-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-[min(85vw,20rem)] animate-drawer-in flex-col bg-white shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4">
              <Brand onClick={closeDrawer} />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <NavLinks items={items} onNavigate={closeDrawer} />
            </div>

            <div className="shrink-0 border-t border-slate-100 p-4">
              <p className="truncate text-sm font-medium text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge tone="blue">{roleLabel}</Badge>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
