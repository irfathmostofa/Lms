import type { Metadata } from 'next';
import { Anek_Bangla } from 'next/font/google';
import { InspectGuard } from '@/components/inspect-guard';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import { getRequestLocale } from '@/lib/locale';
import './globals.css';

const anekBangla = Anek_Bangla({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-anek-bangla',
});

export const metadata: Metadata = {
  title: 'LMS Platform',
  description:
    'Role-based learning management system for online and offline coaching centers, built on Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getRequestLocale();

  return (
    <html lang={locale} className={anekBangla.variable}>
      <body className={anekBangla.className}>
        <InspectGuard />
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
