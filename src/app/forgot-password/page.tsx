import Link from 'next/link';
import { Card, CardBody } from '@/components/ui';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
          LMS Platform
        </Link>
        <Card>
          <CardBody className="p-6">
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Forgot your password?</h1>
            <p className="mb-5 text-sm text-slate-500">
              Enter the email address for your account and we will send you a reset link.
            </p>
            <ForgotPasswordForm />
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
