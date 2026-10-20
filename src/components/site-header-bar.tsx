'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
import { ButtonLink } from '@/components/ui';
import { cn } from '@/lib/utils';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12.5 12.5 16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeaderBar({
  isAuthenticated,
  name,
  avatarUrl,
  dashboardHref,
  initials,
}: {
  isAuthenticated: boolean;
  name: string;
  avatarUrl: string | null;
  dashboardHref: string;
  initials: string;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchPanelId = useId();
  const menuPanelId = useId();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && headerRef.current?.contains(target)) return;
      setSearchOpen(false);
      setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen((open) => !open);
  };

  const openMenu = () => {
    setSearchOpen(false);
    setMenuOpen((open) => !open);
  };

  const accountLink = (
    <Link
      href={dashboardHref}
      aria-label={`${name} dashboard`}
      className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initials}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:inline">{name}</span>
    </Link>
  );

  return (
    <div ref={headerRef}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            L
          </span>
          <span className="hidden sm:inline">LMS Platform</span>
        </Link>

        <CourseSearch inputId="course-search-header" className="hidden max-w-md flex-1 md:block" />

        <nav className="ml-auto hidden items-center gap-3 md:flex">
          <Link href="/courses" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Courses
          </Link>
          <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            About
          </Link>
          {isAuthenticated ? (
            accountLink
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

        <div className="ml-auto flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={openSearch}
            aria-label={searchOpen ? 'Close search' : 'Search courses'}
            aria-expanded={searchOpen}
            aria-controls={searchPanelId}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              searchOpen
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={openMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls={menuPanelId}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              menuOpen
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div
          id={searchPanelId}
          className="animate-search-in border-t border-slate-100 bg-white px-4 py-3 md:hidden"
        >
          <CourseSearch inputId="course-search-header-mobile" autoFocus className="mx-auto max-w-6xl" />
        </div>
      ) : null}

      {menuOpen ? (
        <div id={menuPanelId} className="md:hidden">
          <div className="animate-fade-in border-t border-slate-100 bg-white px-4 py-4">
            <nav className="flex flex-col gap-1">
              <Link
                href="/courses"
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Courses
              </Link>
              <Link
                href="/about"
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                About
              </Link>
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-3">
              {isAuthenticated ? (
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{name}</span>
                    <span className="text-xs text-slate-500">Go to dashboard</span>
                  </span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <ButtonLink href="/login" variant="outline" className="w-full">
                    Sign in
                  </ButtonLink>
                  <ButtonLink href="/register" className="w-full">
                    Get started
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
