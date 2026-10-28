import type { Metadata } from 'next';
import { InspectGuard } from '@/components/inspect-guard';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import { getRequestLocale } from '@/lib/locale';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMS Platform',
  description:
    'Role-based learning management system for online and offline coaching centers, built on Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getRequestLocale();

  return (
    <html lang={locale}>
      <body>
        <InspectGuard />
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
