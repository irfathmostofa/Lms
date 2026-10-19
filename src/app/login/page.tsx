import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      description="Use your registered email and password."
    >
      {searchParams.error === 'auth' ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          That sign in link is invalid or has expired. Please try again.
        </p>
      ) : null}
      <LoginForm next={searchParams.next} />
    </AuthShell>
  );
}
