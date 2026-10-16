'use client';

import { useState } from 'react';
import Image from 'next/image';
import { youtubeThumb } from '@/lib/utils';

export function LazyYouTube({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900"
      aria-label={`Play ${title}`}
    >
      <Image
        src={youtubeThumb(videoId)}
        alt={title}
        fill
        sizes="(max-width: 1024px) 100vw, 66vw"
        className="object-cover opacity-80 transition group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-xl text-brand-700 shadow-lg">
          {'>'}
        </span>
      </span>
    </button>
  );
}
