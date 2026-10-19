'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionContext } from '@/lib/auth';
import { courseAccessCookieName, signCourseAccess, verifyCourseAccess } from '@/lib/course-access';

export async function unlockCourseAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '').trim();
  const courseId = String(formData.get('course_id') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!slug || !courseId) return;

  const supabase = createClient();
  const { data } = await supabase.rpc('verify_course_password', {
    p_course: courseId,
    p_password: password,
  });

  if (data) {
    cookies().set(courseAccessCookieName(courseId), signCourseAccess(courseId), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect(`/courses/${slug}`);
  }

  redirect(`/courses/${slug}?locked=1`);
}

interface CourseEnrollmentRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  price: number;
  discount_price: number | null;
}

interface ExistingEnrollment {
  id: string;
  status: string;
}

type EnrollCourseResult =
  | { success: true; status: string; already: boolean }
  | { error: string };

export async function enrollCourseAction(courseId: string): Promise<EnrollCourseResult> {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: 'Please sign in to enroll in this course.' };
  }

  const role = ctx.profile?.role ?? 'student';
  if (role !== 'student') {
    return { error: 'Only student accounts can enroll in courses.' };
  }

  if (!courseId) {
    return { error: 'Course not found.' };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Enrollment is not configured. Please contact the administrator.' };
  }

  const { data: courseRow, error: courseError } = await admin
    .from('courses')
    .select('id, slug, title, status, visibility, price, discount_price')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError || !courseRow) {
    return { error: 'This course could not be loaded. Please try again.' };
  }

  const course = courseRow as unknown as CourseEnrollmentRow;

  if (course.status !== 'published' || course.visibility === 'private') {
    return { error: 'This course is not open for enrollment.' };
  }

  if (course.visibility === 'password') {
    const token = cookies().get(courseAccessCookieName(course.id))?.value;
    if (!verifyCourseAccess(course.id, token)) {
      return { error: 'Enter the course password before enrolling.' };
    }
  }

  const price = Math.max(0, Number(course.discount_price ?? course.price ?? 0));

  const { data: existingRow } = await admin
    .from('enrollments')
    .select('id, status')
    .eq('student_id', ctx.userId)
    .eq('course_id', course.id)
    .maybeSingle();

  let enrollment = existingRow as unknown as ExistingEnrollment | null;

  if (enrollment && !['cancelled', 'expired'].includes(enrollment.status)) {
    if (enrollment.status === 'pending' && price > 0) {
      await ensureEnrollmentFee(admin, enrollment.id, ctx.userId, course.title, price);
    }
    return { success: true as const, status: enrollment.status, already: true };
  }

  const nextStatus = price > 0 ? 'pending' : 'active';
  let enrollmentId = enrollment?.id ?? null;

  if (enrollment) {
    const { error } = await admin
      .from('enrollments')
      .update({
        status: nextStatus,
        enrolled_by: ctx.userId,
        enrolled_at: new Date().toISOString(),
        completed_at: null,
      })
      .eq('id', enrollment.id);

    if (error) {
      return { error: 'Your enrollment could not be saved. Please try again.' };
    }
  } else {
    const { data: created, error } = await admin
      .from('enrollments')
      .insert({
        student_id: ctx.userId,
        course_id: course.id,
        status: nextStatus,
        enrolled_by: ctx.userId,
      })
      .select('id, status')
      .single();

    if (error || !created) {
      if (error?.code === '23505') {
        const { data: current } = await admin
          .from('enrollments')
          .select('id, status')
          .eq('student_id', ctx.userId)
          .eq('course_id', course.id)
          .maybeSingle();
        enrollment = current as unknown as ExistingEnrollment | null;
        enrollmentId = enrollment?.id ?? null;
      } else {
        return { error: 'Your enrollment could not be created. Please try again.' };
      }
    } else {
      enrollmentId = created.id;
    }
  }

  if (!enrollmentId) {
    return { error: 'Your enrollment could not be created. Please try again.' };
  }

  if (nextStatus === 'pending' && price > 0) {
    const feeResult = await ensureEnrollmentFee(
      admin,
      enrollmentId,
      ctx.userId,
      course.title,
      price,
    );
    if ('error' in feeResult) return feeResult;
  }

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath('/courses');
  revalidatePath('/dashboard/my-learning');
  revalidatePath('/dashboard/my-fees');
  revalidatePath('/dashboard/enrollments');

  return { success: true as const, status: nextStatus, already: false };
}

async function ensureEnrollmentFee(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string,
  studentId: string,
  courseTitle: string,
  amount: number,
): Promise<{ success: true } | { error: string }> {
  const { data: existingFee } = await admin
    .from('fee_records')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle();

  if (existingFee) return { success: true as const };

  const { error } = await admin.from('fee_records').insert({
    enrollment_id: enrollmentId,
    student_id: studentId,
    description: `${courseTitle} fee`,
    total_amount: amount,
    discount_amount: 0,
    installments: 1,
    status: 'unpaid',
  });

  if (error) {
    return { error: 'Your fee record could not be created. Please try again.' };
  }

  return { success: true as const };
}
