import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined) {
  const value = Number(amount ?? 0);
  return `BDT ${value.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Accepts a raw YouTube id or any common YouTube URL and returns the id.
 * Unknown values return an empty string so the player never loads a bad id.
 */
function normalizeYoutubeId(value: string) {
  const id = value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
  return YOUTUBE_ID.test(id) ? id : '';
}

export function youtubeIdFromInput(value: string | null | undefined) {
  const input = (value ?? '').trim();
  if (!input) return '';
  const direct = normalizeYoutubeId(input);
  if (direct) return direct;

  try {
    const url = new URL(input);
    if (url.hostname.includes('youtu.be')) {
      return normalizeYoutubeId(url.pathname.split('/').filter(Boolean)[0] ?? '');
    }
    const v = url.searchParams.get('v');
    if (v) return normalizeYoutubeId(v);
    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
    if (marker >= 0 && parts[marker + 1]) return normalizeYoutubeId(parts[marker + 1]);
  } catch {
    return '';
  }

  return '';
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string | null | undefined) {
  const input = (value ?? '').trim();
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function splitList(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

