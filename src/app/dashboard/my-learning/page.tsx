import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { LearningLibrary, type LearningCourse } from '@/components/dashboard/learning-library';

export const dynamic = 'force-dynamic';

interface EnrollmentCourseRow {
  id: string;
  status: string;
  course_id: string;
  courses: {
    title: string;
    slug: string;
    mode: string | null;
    thumbnail_url: string | null;
    author_name: string | null;
    total_lessons: number | null;
  } | null;
}

export default async function MyLearningPage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [enrollmentsRes, progressRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select(
        'id, status, course_id, courses(title, slug, mode, thumbnail_url, author_name, total_lessons)',
      )
      .eq('student_id', ctx.userId)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('vw_course_progress')
      .select('course_id, total_lessons, completed_lessons, progress_pct')
      .eq('student_id', ctx.userId),
  ]);

  const enrollments = (enrollmentsRes.data as unknown as EnrollmentCourseRow[]) ?? [];
  const progress = (progressRes.data as {
    course_id: string;
    total_lessons: number;
    completed_lessons: number;
    progress_pct: number;
  }[]) ?? [];
  const progressByCourse = new Map(progress.map((row) => [row.course_id, row]));

  const courses: LearningCourse[] = enrollments.map((enrollment) => {
    const stats = progressByCourse.get(enrollment.course_id);
    return {
      id: enrollment.id,
      courseId: enrollment.course_id,
      title: enrollment.courses?.title ?? 'Course',
      slug: enrollment.courses?.slug ?? '',
      mode: enrollment.courses?.mode ?? null,
      status: enrollment.status,
      thumbnailUrl: enrollment.courses?.thumbnail_url ?? null,
      authorName: enrollment.courses?.author_name ?? null,
      totalLessons: Number(stats?.total_lessons ?? enrollment.courses?.total_lessons ?? 0),
      completedLessons: Number(stats?.completed_lessons ?? 0),
      progressPct: Number(stats?.progress_pct ?? 0),
    };
  });

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">My learning</h1>
        <p className="mt-2 text-sm text-slate-500">
          You have not enrolled in any courses yet. Browse the catalog and start your first lecture.
        </p>
        <Link
          href="/courses"
          className="mt-6 inline-flex min-h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  return <LearningLibrary courses={courses} />;
}
