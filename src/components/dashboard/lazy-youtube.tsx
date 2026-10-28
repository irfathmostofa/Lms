'use client';

import { SecureYouTubePlayer } from '@/components/dashboard/secure-youtube-player';

export function LazyYouTube({
  videoId,
  title,
  watermark = '',
}: {
  videoId: string;
  title: string;
  watermark?: string;
}) {
  return <SecureYouTubePlayer videoId={videoId} title={title} watermark={watermark} />;
}
