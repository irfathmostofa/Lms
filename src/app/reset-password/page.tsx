import Link from 'next/link';
import { Card, CardBody } from '@/components/ui';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
          LMS Platform
        </Link>
        <Card>
          <CardBody className="p-6">
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Set a new password</h1>
            <p className="mb-5 text-sm text-slate-500">
              Choose a new password for your account. You will be signed in automatically.
            </p>
            <UpdatePasswordForm />
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
