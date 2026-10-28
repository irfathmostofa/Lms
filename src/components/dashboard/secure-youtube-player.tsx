'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { youtubeThumb } from '@/lib/utils';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

interface YouTubeApi {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      width: string | number;
      height: string | number;
      host?: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API is browser only'));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled || !window.YT?.Player) return;
      settled = true;
      resolve(window.YT);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      apiPromise = null;
      reject(error);
    };

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => fail(new Error('YouTube API failed to load'));
      document.head.appendChild(script);
    }

    const poll = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(poll);
        window.clearTimeout(timer);
        finish();
      }
    }, 50);

    const timer = window.setTimeout(() => {
      window.clearInterval(poll);
      fail(new Error('YouTube API timed out'));
    }, 12000);
  });

  return apiPromise;
}

const WATERMARK_POSITIONS = [
  { top: '12%', left: '7%' },
  { top: '16%', left: '54%' },
  { top: '46%', left: '10%' },
  { top: '40%', left: '50%' },
  { top: '64%', left: '28%' },
  { top: '8%', left: '34%' },
  { top: '58%', left: '60%' },
  { top: '32%', left: '24%' },
];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 60) return `${mins}:${String(secs).padStart(2, '0')}`;
  const hours = Math.floor(mins / 60);
  return `${hours}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function MovingWatermark({ label }: { label: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let current = 0;
    const timer = window.setInterval(() => {
      let next = current;
      while (next === current) {
        next = Math.floor(Math.random() * WATERMARK_POSITIONS.length);
      }
      current = next;
      setIndex(next);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  const position = WATERMARK_POSITIONS[index];

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute z-20 max-w-[80%] truncate text-[8px] font-bold tracking-wide text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-[top,left] duration-[1400ms] ease-in-out sm:text-[9px]"
      style={{ top: position.top, left: position.left }}
    >
      {label}
    </span>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M7 5.5h3.5v13H7v-13zM13.5 5.5H17v13h-3.5v-13z" />
    </svg>
  );
}

function FullscreenIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      {expanded ? (
        <path
          d="M9 9H5.5V5.5M15 9h3.5V5.5M9 15H5.5v3.5M15 15h3.5v3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8 4.5H4.5V8M16 4.5h3.5V8M8 19.5H4.5V16M16 19.5h3.5V16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 9.5h3L11 6v12l-4-3.5H4v-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M15 9.5l4 5M19 9.5l-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path
          d="M14 9a4 4 0 010 6M16.5 7a7 7 0 010 10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function SecureYouTubePlayer({
  videoId,
  title,
  watermark,
  fill = false,
}: {
  videoId: string;
  title: string;
  watermark: string;
  fill?: boolean;
}) {
  const rawId = useId();
  const containerId = `yt-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const validVideo = /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const startedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    startedRef.current = false;
    setStarted(false);
    setReady(false);
    setPlaying(false);
    setDuration(0);
    setCurrent(0);
    setMuted(false);
    setFailed(false);
    setFullscreen(false);
  }, [videoId]);

  useEffect(() => {
    if (!validVideo) return;

    let cancelled = false;
    let frame = 0;
    let mountedHost: HTMLDivElement | null = null;

    const boot = () => {
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          const node = hostRef.current;
          if (!node) return;
          mountedHost = node;

          node.replaceChildren();
          const mount = document.createElement('div');
          mount.id = containerId;
          mount.className = 'h-full w-full';
          node.appendChild(mount);

          const player = new YT.Player(containerId, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 0,
              rel: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              cc_load_policy: 0,
              playsinline: 1,
              fs: 0,
              disablekb: 1,
              enablejsapi: 1,
            },
            events: {
              onReady: ({ target }) => {
                if (cancelled) return;
                playerRef.current = target;
                setReady(true);
                setDuration(target.getDuration());
                if (startedRef.current) {
                  try {
                    target.unMute();
                    target.playVideo();
                  } catch {
                    try {
                      target.mute();
                      target.playVideo();
                      window.setTimeout(() => {
                        try {
                          target.unMute();
                          setMuted(false);
                        } catch {
                          // ignore
                        }
                      }, 250);
                    } catch {
                      // ignore
                    }
                  }
                }
              },
              onStateChange: ({ data, target }) => {
                if (cancelled) return;
                setPlaying(data === 1);
                if (data === 1) {
                  setStarted(true);
                  startedRef.current = true;
                  setDuration(target.getDuration());
                }
              },
              onError: () => {
                if (!cancelled) setFailed(true);
              },
            },
          });

          playerRef.current = player;
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };

    const start = () => {
      if (hostRef.current) {
        boot();
        return;
      }
      frame = window.requestAnimationFrame(start);
    };

    start();

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
      mountedHost?.replaceChildren();
    };
  }, [containerId, validVideo, videoId]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const nextCurrent = player.getCurrentTime();
        const nextDuration = player.getDuration();
        if (Number.isFinite(nextCurrent)) setCurrent(nextCurrent);
        if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration);
      } catch {
        // ignore
      }
    }, 400);
    return () => window.clearInterval(timer);
  }, [started]);

  const startPlayback = useCallback(() => {
    startedRef.current = true;
    setStarted(true);
    const player = playerRef.current;
    if (!player) return;
    try {
      player.unMute();
      player.playVideo();
    } catch {
      try {
        player.mute();
        player.playVideo();
        window.setTimeout(() => {
          try {
            player.unMute();
            setMuted(false);
          } catch {
            // ignore
          }
        }, 250);
      } catch {
        // ignore
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!startedRef.current) {
      startPlayback();
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    try {
      if (player.getPlayerState() === 1) player.pauseVideo();
      else player.playVideo();
    } catch {
      // ignore
    }
  }, [startPlayback]);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (player.isMuted()) {
        player.unMute();
        setMuted(false);
      } else {
        player.mute();
        setMuted(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const seek = useCallback((value: number) => {
    const player = playerRef.current;
    if (!player) return;
    setCurrent(value);
    try {
      player.seekTo(value, true);
    } catch {
      // ignore
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const node = shellRef.current;
    if (!node) return;
    const active = document.fullscreenElement;
    if (active === node) {
      void document.exitFullscreen();
      return;
    }
    void node.requestFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === shellRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!started) return;
    const node = shellRef.current;
    if (!node) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
        event.preventDefault();
        togglePlay();
      }
      if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        toggleMute();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        seek(Math.min(current + 5, duration || current + 5));
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seek(Math.max(current - 5, 0));
      }
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [current, duration, seek, started, toggleFullscreen, toggleMute, togglePlay]);

  if (!validVideo) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900 text-sm text-white/70 ${
          fill ? 'h-full rounded-none' : 'aspect-video rounded-lg'
        }`}
      >
        This video is unavailable.
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      className={`relative w-full select-none overflow-hidden bg-black outline-none ${
        fullscreen || fill ? 'h-full rounded-none' : 'aspect-video rounded-lg'
      }`}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
        <div
          ref={hostRef}
          aria-hidden="true"
          className="absolute inset-x-0 -top-12 bottom-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-black/70 to-transparent" />

      {!started ? (
        <button
          type="button"
          onClick={startPlayback}
          className="absolute inset-0 z-40 block h-full w-full overflow-hidden bg-slate-900"
          aria-label={`Play ${title}`}
        >
          <Image
            src={youtubeThumb(videoId)}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            draggable={false}
            className="pointer-events-none object-contain opacity-80"
          />
          <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-700 shadow-xl ring-4 ring-white/30">
              <PlayIcon />
            </span>
          </span>
          {watermark ? (
            <span className="pointer-events-none absolute bottom-3 left-3 z-10 text-[8px] font-bold tracking-wide text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-[9px]">
              {watermark}
            </span>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent focus-visible:outline-none"
        />
      )}

      {started && !ready && !failed ? (
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-xs font-medium text-white/70">
          Loading protected video...
        </span>
      ) : null}

      {started && ready && !playing && !failed ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm">
            <PlayIcon />
          </span>
        </span>
      ) : null}

      {failed ? (
        <span className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-white/80">
          This video could not be loaded. Please refresh and try again.
        </span>
      ) : null}

      {watermark ? <MovingWatermark label={watermark} /> : null}

      <div
        className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-2 pt-8"
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/80">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.1}
          value={Math.min(current, Math.max(duration, 1))}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Seek video"
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
        />

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <VolumeIcon muted={muted} />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <FullscreenIcon expanded={fullscreen} />
        </button>
      </div>
    </div>
  );
}
