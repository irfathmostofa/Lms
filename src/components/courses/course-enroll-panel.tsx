'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, ButtonLink } from '@/components/ui';
import { enrollCourseAction } from '@/actions/courses';
import { LoginModal, type LoginModalResult } from '@/components/auth/login-modal';
import { ROLE_HOME } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { useLocale } from '@/components/i18n/locale-provider';
import type { UserRole } from '@/lib/types';

export function CourseEnrollPanel({
  courseId,
  courseSlug,
  price,
  isLoggedIn,
  role,
  enrollmentStatus,
}: {
  courseId: string;
  courseSlug: string;
  price: number;
  isLoggedIn: boolean;
  role: UserRole | null;
  enrollmentStatus: string | null;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [showLogin, setShowLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeLogin = useCallback(() => setShowLogin(false), []);

  const enroll = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await enrollCourseAction(courseId);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      if (result.status === 'active') {
        router.push(`/dashboard/my-learning/${courseId}`);
        return;
      }
      router.refresh();
    } catch {
      setError(t('enroll.error'));
    } finally {
      setBusy(false);
    }
  }, [courseId, router, t]);

  const handleLoginSuccess = useCallback(
    (result: LoginModalResult) => {
      setShowLogin(false);
      if (result.role !== 'student') {
        router.push(result.next);
        return;
      }
      void enroll();
    },
    [enroll, router],
  );

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}
        <Button
          type="button"
          size="lg"
          className="w-full rounded-none bg-[#a435f0] font-bold hover:bg-[#8710d8]"
          onClick={() => {
            setError(null);
            setShowLogin(true);
          }}
        >
          {t('enroll.enrollNow')}
        </Button>
        <p className="text-center text-xs text-slate-500">
          {price > 0
            ? t('enroll.signInFee', { price: formatCurrency(price) })
            : t('enroll.signInFree')}
        </p>
        {showLogin ? (
          <LoginModal
            next={`/courses/${courseSlug}`}
            onClose={closeLogin}
            onSuccess={handleLoginSuccess}
          />
        ) : null}
      </div>
    );
  }

  const currentRole = role ?? 'student';
  if (currentRole !== 'student') {
    return (
      <div className="space-y-3">
        <ButtonLink href={ROLE_HOME[currentRole] ?? '/dashboard'} size="lg" className="w-full rounded-none font-bold">
          {t('enroll.openDashboard')}
        </ButtonLink>
        <p className="text-center text-xs text-slate-500">
          {t('enroll.staffOnly')}
        </p>
      </div>
    );
  }

  if (enrollmentStatus === 'active' || enrollmentStatus === 'completed') {
    return (
      <div className="space-y-3">
        <Badge tone="green">
          {enrollmentStatus === 'completed' ? t('enroll.completed') : t('enroll.enrolled')}
        </Badge>
        <ButtonLink
          href={`/dashboard/my-learning/${courseId}`}
          size="lg"
          className="w-full rounded-none bg-[#a435f0] font-bold hover:bg-[#8710d8]"
        >
          {t('enroll.goLearning')}
        </ButtonLink>
        <p className="text-center text-xs text-slate-500">
          {t('enroll.alreadyAccess')}
        </p>
      </div>
    );
  }

  if (enrollmentStatus === 'pending') {
    return (
      <div className="space-y-3">
        <Badge tone="amber">{t('enroll.paymentPending')}</Badge>
        <ButtonLink href="/dashboard/my-fees" size="lg" className="w-full rounded-none bg-[#a435f0] font-bold hover:bg-[#8710d8]">
          {t('enroll.completePayment')}
        </ButtonLink>
        <p className="text-center text-xs text-slate-500">
          {t('enroll.pendingBody')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollmentStatus === 'cancelled' || enrollmentStatus === 'expired' ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {t('enroll.previousCancelled', { status: enrollmentStatus })}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="w-full rounded-none bg-[#a435f0] font-bold hover:bg-[#8710d8]"
        onClick={() => void enroll()}
        disabled={busy}
      >
        {busy ? t('enroll.enrolling') : t('enroll.enrollNow')}
      </Button>
      <p className="text-center text-xs text-slate-500">
        {price > 0
          ? t('enroll.payFromFees', { price: formatCurrency(price) })
          : t('enroll.freeAccess')}
      </p>
    </div>
  );
}
