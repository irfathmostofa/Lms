import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

interface EnrollmentCourseRow {
  id: string;
  status: string;
  course_id: string;
  courses: { title: string; slug: string; mode: string } | null;
}

export default async function MyLearningPage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [enrollmentsRes, progressRes, assessmentsRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, status, course_id, courses(title, slug, mode)')
      .eq('student_id', ctx.userId)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('vw_course_progress')
      .select('course_id, total_lessons, completed_lessons, progress_pct')
      .eq('student_id', ctx.userId),
    supabase
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
  ]);

  const enrollments = (enrollmentsRes.data as unknown as EnrollmentCourseRow[]) ?? [];
  const progress = (progressRes.data as {
    course_id: string;
    total_lessons: number;
    completed_lessons: number;
    progress_pct: number;
  }[]) ?? [];
  const progressByCourse = new Map(progress.map((row) => [row.course_id, row]));

  const activeCount = enrollments.filter((enrollment) => enrollment.status === 'active').length;

  return (
    <>
      <PageHeader title="My learning" description="Your enrolled courses and progress." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled courses" value={enrollments.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Published assessments" value={assessmentsRes.count ?? 0} />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Once you enroll in a course, it will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const stats = progressByCourse.get(enrollment.course_id);
            const pct = Number(stats?.progress_pct ?? 0);
            return (
              <Link key={enrollment.id} href={`/dashboard/my-learning/${enrollment.course_id}`}>
                <Card className="h-full transition hover:shadow-md">
                  <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge tone={enrollment.status === 'active' ? 'green' : 'amber'}>
                        {enrollment.status}
                      </Badge>
                      {enrollment.courses?.mode ? <Badge>{enrollment.courses.mode}</Badge> : null}
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {enrollment.courses?.title ?? 'Course'}
                    </h2>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {stats?.completed_lessons ?? 0} of {stats?.total_lessons ?? 0} lessons
                    </p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
