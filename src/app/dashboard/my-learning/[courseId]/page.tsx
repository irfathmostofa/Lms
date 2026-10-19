import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { toggleLessonProgressAction } from '@/actions/student';
import { Badge, ButtonLink, Card, CardBody, CardHeader } from '@/components/ui';
import { CourseClassroom } from '@/components/dashboard/course-classroom';
import type { Course, CourseSection, Lesson } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { lesson?: string };
}) {
  const ctx = await requireUser();
  const supabase = createClient();

  const [courseRes, enrollmentRes] = await Promise.all([
    supabase.from('courses').select('*').eq('id', params.courseId).maybeSingle(),
    supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', ctx.userId)
      .eq('course_id', params.courseId)
      .maybeSingle(),
  ]);

  const course = courseRes.data as Course | null;
  const enrollment = enrollmentRes.data as { id: string; status: string } | null;
  if (!course || !enrollment) notFound();

  const hasAccess = enrollment.status === 'active' || enrollment.status === 'completed';

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Link href="/dashboard/my-learning" className="text-sm text-brand-600 hover:underline">
          Back to my learning
        </Link>
        <Card className="mt-4">
          <CardHeader
            title={course.title}
            description="Your enrollment is not active yet."
            action={<Badge tone="amber">{enrollment.status}</Badge>}
          />
          <CardBody className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-600">
              Lessons and protected videos unlock automatically once your payment is verified and
              your enrollment is active.
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/dashboard/my-fees" size="sm">
                Check payment status
              </ButtonLink>
              <ButtonLink href={`/courses/${course.slug}`} size="sm" variant="outline">
                View course details
              </ButtonLink>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [sectionsRes, lessonsRes, progressRes] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', course.id).order('sort_order'),
    supabase.from('lessons').select('*').eq('course_id', course.id).order('sort_order'),
    supabase
      .from('lesson_progress')
      .select('lesson_id, is_completed')
      .eq('student_id', ctx.userId)
      .eq('course_id', course.id),
  ]);

  const sections = (sectionsRes.data as CourseSection[]) ?? [];
  const lessons = (lessonsRes.data as Lesson[]) ?? [];
  const progress = (progressRes.data as { lesson_id: string; is_completed: boolean }[]) ?? [];
  const completedIds = progress.filter((row) => row.is_completed).map((row) => row.lesson_id);
  const activeLesson =
    lessons.find((lesson) => lesson.id === searchParams.lesson) ?? lessons[0] ?? null;

  return (
    <CourseClassroom
      course={course}
      sections={sections}
      lessons={lessons}
      activeLesson={activeLesson}
      completedIds={completedIds}
      watermark={ctx.email ?? ctx.profile?.email ?? `ID ${ctx.userId.slice(0, 8)}`}
      completeAction={toggleLessonProgressAction}
    />
  );
}
