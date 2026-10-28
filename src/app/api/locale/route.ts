import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const locale = resolveLocale(String(form.get('locale') ?? ''));
  const next = String(form.get('next') ?? '/') || '/';
  const safeNext = next.startsWith('/') ? next : '/';

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}
