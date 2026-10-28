import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { getRequestDictionary } from '@/lib/locale';

export default function ForgotPasswordPage() {
  const dict = getRequestDictionary();
  return (
    <AuthShell
      eyebrow={dict.auth.recoveryEyebrow}
      title={dict.auth.recoveryTitle}
      description={dict.auth.recoveryBody}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
