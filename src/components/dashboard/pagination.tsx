import Link from 'next/link';
import { cn } from '@/lib/utils';

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function buildHref(basePath: string, params: SearchParamsInput, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'page' || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== '') {
      query.set(key, value);
    }
  });
  if (page > 1) query.set('page', String(page));
  const suffix = query.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

function pageWindow(page: number, totalPages: number) {
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let value = start; value <= end; value += 1) pages.push(value);
  return pages;
}

export function Pagination({
  page,
  totalItems,
  pageSize,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
  searchParams?: SearchParamsInput;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(totalItems, current * pageSize);
  const pages = pageWindow(current, totalPages);

  const linkClass =
    'inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition';

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        {totalItems === 0 ? 'No records' : `Showing ${from}-${to} of ${totalItems}`}
      </p>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
          {current > 1 ? (
            <Link
              href={buildHref(basePath, searchParams, current - 1)}
              className={cn(linkClass, 'border-slate-200 text-slate-600 hover:bg-slate-50')}
            >
              Previous
            </Link>
          ) : (
            <span className={cn(linkClass, 'border-slate-100 text-slate-300')}>Previous</span>
          )}

          {pages[0] > 1 ? <span className="px-1 text-xs text-slate-400">...</span> : null}

          {pages.map((value) => (
            <Link
              key={value}
              href={buildHref(basePath, searchParams, value)}
              aria-current={value === current ? 'page' : undefined}
              className={cn(
                linkClass,
                value === current
                  ? 'border-brand-500 bg-brand-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {value}
            </Link>
          ))}

          {pages[pages.length - 1] < totalPages ? (
            <span className="px-1 text-xs text-slate-400">...</span>
          ) : null}

          {current < totalPages ? (
            <Link
              href={buildHref(basePath, searchParams, current + 1)}
              className={cn(linkClass, 'border-slate-200 text-slate-600 hover:bg-slate-50')}
            >
              Next
            </Link>
          ) : (
            <span className={cn(linkClass, 'border-slate-100 text-slate-300')}>Next</span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
