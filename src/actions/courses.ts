'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { courseAccessCookieName, signCourseAccess } from '@/lib/course-access';

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
