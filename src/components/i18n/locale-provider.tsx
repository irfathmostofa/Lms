'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { getDictionary, translate, type Dictionary, type Locale } from '@/lib/i18n';

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const dict = getDictionary(locale);
  const value: LocaleContextValue = {
    locale,
    dict,
    t: (key, vars) => translate(dict, key, vars),
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
