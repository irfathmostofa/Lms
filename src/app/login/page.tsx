import Link from 'next/link';
import { Card, CardBody } from '@/components/ui';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
          LMS Platform
        </Link>
        <Card>
          <CardBody className="p-6">
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Welcome back</h1>
            <p className="mb-5 text-sm text-slate-500">Sign in to your portal.</p>
            {searchParams.error === 'auth' ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                That sign in link is invalid or has expired. Please try again.
              </p>
            ) : null}
            <LoginForm next={searchParams.next} />
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
