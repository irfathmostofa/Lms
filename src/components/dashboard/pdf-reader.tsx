'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ButtonLink } from '@/components/ui';

function viewerSrc(fileUrl: string) {
  const hashIndex = fileUrl.indexOf('#');
  const base = hashIndex >= 0 ? fileUrl.slice(0, hashIndex) : fileUrl;
  return `${base}#toolbar=1&navpanes=0&scrollbar=1`;
}

export function PdfReader({
  title,
  fileUrl,
  backHref = '/dashboard/store',
}: {
  title: string;
  fileUrl: string;
  backHref?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => viewerSrc(fileUrl), [fileUrl]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <Link href={backHref} className="text-xs font-medium text-white/60 hover:text-white">
            Back to resources
          </Link>
          <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
        </div>
        <a
          href={fileUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 shrink-0 items-center rounded-lg bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-100"
        >
          Download PDF
        </a>
      </header>

      <main className="flex min-h-0 flex-1 flex-col bg-slate-900">
        {failed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-md text-sm text-white/70">
              This browser could not embed the PDF. Open or download it instead.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href={fileUrl} target="_blank" rel="noreferrer">
                Open PDF
              </ButtonLink>
              <a
                href={fileUrl}
                download
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-medium text-white hover:bg-white/10"
              >
                Download
              </a>
            </div>
          </div>
        ) : (
          <iframe
            title={title}
            src={src}
            className="h-full min-h-[calc(100dvh-3.5rem)] w-full border-0 bg-slate-900"
            onError={() => setFailed(true)}
          />
        )}
      </main>
    </div>
  );
}
