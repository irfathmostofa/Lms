import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { getRequestDictionary } from '@/lib/locale';

export default function RegisterPage() {
  const dict = getRequestDictionary();
  return (
    <AuthShell
      eyebrow={dict.auth.registerEyebrow}
      title={dict.auth.registerTitle}
      description={dict.auth.registerBody}
    >
      <RegisterForm />
    </AuthShell>
  );
}
