import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDictionary, resolveLocale, type Locale } from '@/lib/i18n';

export function getRequestLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return resolveLocale(value ?? DEFAULT_LOCALE);
}

export function getRequestDictionary() {
  return getDictionary(getRequestLocale());
}
