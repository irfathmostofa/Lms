'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { CourseSearch } from '@/components/courses/course-search';
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

const NAV_LINKS = [
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
];

export function SiteHeaderBar({
  siteName,
  isAuthenticated,
  name,
  avatarUrl,
  dashboardHref,
  initials,
}: {
  siteName: string;
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
  const mark = siteName.trim().slice(0, 1).toUpperCase() || 'L';

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
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
          {initials}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-sm font-medium text-white/90 sm:inline">{name}</span>
    </Link>
  );

  return (
    <div ref={headerRef}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:gap-5 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 via-brand-600 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-brand-600/30 ring-1 ring-white/20">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            <span className="relative">{mark}</span>
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-[15px] font-semibold tracking-tight text-white">{siteName}</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">Learn with intent</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition',
                  active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <CourseSearch
          variant="header-dark"
          inputId="course-search-header"
          className="hidden max-w-md flex-1 md:block"
        />

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            accountLink
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-brand-50"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={openSearch}
            aria-label={searchOpen ? 'Close search' : 'Search courses'}
            aria-expanded={searchOpen}
            aria-controls={searchPanelId}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              searchOpen
                ? 'border-white/20 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10',
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
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              menuOpen
                ? 'border-white/20 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10',
            )}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div id={searchPanelId} className="animate-search-in border-t border-white/10 bg-slate-950 px-4 py-3 md:hidden">
          <CourseSearch inputId="course-search-header-mobile" autoFocus className="mx-auto max-w-6xl" />
        </div>
      ) : null}

      {menuOpen ? (
        <div id={menuPanelId} className="md:hidden">
          <div className="animate-fade-in border-t border-white/10 bg-slate-950 px-4 py-4">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 border-t border-white/10 pt-3">
              {isAuthenticated ? (
                <Link href={dashboardHref} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{name}</span>
                    <span className="text-xs text-white/50">Go to dashboard</span>
                  </span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 text-sm font-medium text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
