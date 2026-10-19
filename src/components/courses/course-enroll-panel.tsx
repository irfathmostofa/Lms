'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, ButtonLink } from '@/components/ui';
import { enrollCourseAction } from '@/actions/courses';
import { LoginModal, type LoginModalResult } from '@/components/auth/login-modal';
import { ROLE_HOME } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
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
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [courseId, router]);

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
          className="w-full"
          onClick={() => {
            setError(null);
            setShowLogin(true);
          }}
        >
          Enroll now
        </Button>
        <p className="text-center text-xs text-slate-500">
          {price > 0
            ? `Sign in to enroll. Course fee ${formatCurrency(price)}.`
            : 'Free course. Sign in to start learning.'}
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
        <ButtonLink href={ROLE_HOME[currentRole] ?? '/dashboard'} size="lg" className="w-full">
          Open my dashboard
        </ButtonLink>
        <p className="text-center text-xs text-slate-500">
          Enrollment is available for student accounts.
        </p>
      </div>
    );
  }

  if (enrollmentStatus === 'active' || enrollmentStatus === 'completed') {
    return (
      <div className="space-y-3">
        <Badge tone="green">
          {enrollmentStatus === 'completed' ? 'Completed' : 'Enrolled'}
        </Badge>
        <ButtonLink
          href={`/dashboard/my-learning/${courseId}`}
          size="lg"
          className="w-full"
        >
          Go to my learning
        </ButtonLink>
        <p className="text-center text-xs text-slate-500">
          You already have access to this course.
        </p>
      </div>
    );
  }

  if (enrollmentStatus === 'pending') {
    return (
      <div className="space-y-3">
        <Badge tone="amber">Payment pending</Badge>
        <ButtonLink href="/dashboard/my-fees" size="lg" className="w-full">
          Complete payment
        </ButtonLink>
        <p className="text-center text-xs text-slate-500">
          Your enrollment is saved. Access activates after the payment is verified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollmentStatus === 'cancelled' || enrollmentStatus === 'expired' ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Your previous enrollment was {enrollmentStatus}. You can enroll again below.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => void enroll()}
        disabled={busy}
      >
        {busy ? 'Enrolling...' : 'Enroll now'}
      </Button>
      <p className="text-center text-xs text-slate-500">
        {price > 0
          ? `Enroll now and pay ${formatCurrency(price)} from your fees page.`
          : 'Free course. Enrollment gives you immediate access.'}
      </p>
    </div>
  );
}
