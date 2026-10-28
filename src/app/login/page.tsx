import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { LoginGreeting } from '@/components/auth/login-greeting';
import { getRequestDictionary } from '@/lib/locale';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const dict = getRequestDictionary();
  return (
    <AuthShell header={<LoginGreeting />}>
      {searchParams.error === 'auth' ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {dict.auth.invalidLink}
        </p>
      ) : null}
      <LoginForm next={searchParams.next} />
    </AuthShell>
  );
}
