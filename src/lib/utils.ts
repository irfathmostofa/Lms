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
function cleanYoutubeId(value: string | null | undefined) {
  const id = (value ?? '').trim().split(/[?&#/]/)[0];
  return YOUTUBE_ID.test(id) ? id : '';
}

export function youtubeIdFromInput(value: string | null | undefined) {
  const input = (value ?? '').trim();
  if (!input) return '';
  const direct = cleanYoutubeId(input);
  if (direct) return direct;

  try {
    const url = new URL(input);
    if (url.hostname.includes('youtu.be')) {
      return cleanYoutubeId(url.pathname.split('/').filter(Boolean)[0]);
    }
    const v = url.searchParams.get('v');
    if (v) {
      const fromQuery = cleanYoutubeId(v);
      if (fromQuery) return fromQuery;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
    if (marker >= 0 && parts[marker + 1]) return cleanYoutubeId(parts[marker + 1]);
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

export function toWhatsAppNumber(value: string | null | undefined) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = `88${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function whatsappHref(value: string | null | undefined, text?: string) {
  const number = toWhatsAppNumber(value);
  if (!number) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number}${query}`;
}

