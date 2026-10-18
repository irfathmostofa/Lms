import { createHmac, timingSafeEqual } from 'crypto';

const secret =
  process.env.COURSE_ACCESS_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'lms-local-course-access';

export function courseAccessCookieName(courseId: string) {
  return `course_unlock_${courseId}`;
}

export function signCourseAccess(courseId: string) {
  return createHmac('sha256', secret).update(courseId).digest('hex');
}

export function verifyCourseAccess(courseId: string, token: string | undefined) {
  if (!token) return false;
  const expected = signCourseAccess(courseId);
  const actual = Buffer.from(token);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}
