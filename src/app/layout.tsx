import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMS Platform',
  description:
    'Role-based learning management system for online and offline coaching centers, built on Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
