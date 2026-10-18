import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import {
  createSectionAction,
  deleteCurriculumItemAction,
  deleteSectionAction,
  updateCourseAdditionalAction,
} from '@/actions/dashboard';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { CourseBasicForm } from '@/components/dashboard/course-basic-form';
import { CourseSetupSteps, type CourseSetupStep } from '@/components/dashboard/course-setup-steps';
import { CurriculumItemForm } from '@/components/dashboard/curriculum-item-form';
import { formatDate } from '@/lib/utils';
import type { Assessment, Category, Course, CourseSection, Lesson } from '@/lib/types';

export const dynamic = 'force-dynamic';

const errors: Record<string, string> = {
  title: 'A course title is required.',
  slug: 'That slug is already used by another course.',
  password: 'Add an access password for a password-protected course.',
  image: 'Use a JPG, PNG or WebP image up to 5 MB.',
  upload: 'The image could not be uploaded. Check the thumbnails storage bucket.',
  save: 'The course could not be saved. Please try again.',
};

const statusTone: Record<string, 'slate' | 'amber' | 'green' | 'violet'> = {
  draft: 'slate',
  review: 'amber',
  published: 'green',
  archived: 'violet',
};

const validSteps: CourseSetupStep[] = ['basic', 'curriculum', 'additional'];

interface CurriculumEntry {
  id: string;
  kind: 'lesson' | 'assessment';
  title: string;
  type: string;
  meta: string;
  sortOrder: number;
}

export default async function CourseSetupPage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { step?: string; error?: string; saved?: string };
}) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'editor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { data: courseRow } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.courseId)
    .maybeSingle();
  if (!courseRow) notFound();

  const course = courseRow as Course;
  const step: CourseSetupStep = validSteps.includes(searchParams.step as CourseSetupStep)
    ? (searchParams.step as CourseSetupStep)
    : 'basic';

  const [categoriesRes, authorsRes, accessRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('role', ['admin', 'instructor', 'editor'])
      .order('full_name'),
    supabase.from('course_access').select('course_id').eq('course_id', course.id).maybeSingle(),
  ]);

  const categories = (categoriesRes.data as Category[]) ?? [];
  const authors =
    (authorsRes.data as { id: string; full_name: string | null; email: string | null }[]) ?? [];

  return (
    <>
      <PageHeader
        title={`Course setup: ${course.title}`}
        description="Work through the three steps, then publish from the courses list."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[course.status]}>{course.status}</Badge>
            <ButtonLink href={`/courses/${course.slug}`} size="sm" variant="outline">
              View course
            </ButtonLink>
            <ButtonLink href="/dashboard/courses" size="sm" variant="secondary">
              All courses
            </ButtonLink>
          </div>
        }
      />

      <CourseSetupSteps courseId={course.id} current={step} />

      {searchParams.error && errors[searchParams.error] ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors[searchParams.error]}
        </div>
      ) : null}
      {searchParams.saved ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Changes saved.
        </div>
      ) : null}

      {step === 'basic' ? (
        <Card>
          <CardHeader
            title="Step 1 - Basic setup"
            description="Title, description, access, featured image, video, pricing, category, tags and author."
          />
          <CardBody>
            <CourseBasicForm
              course={course}
              hasPassword={Boolean(accessRes.data)}
              categories={categories.map((category) => ({ id: category.id, name: category.name }))}
              authors={authors.map((author) => ({
                id: author.id,
                name: author.full_name ?? author.email ?? 'Unnamed',
              }))}
              currentUserId={ctx?.userId ?? ''}
            />
          </CardBody>
        </Card>
      ) : null}

      {step === 'curriculum' ? (
        <CurriculumStep course={course} />
      ) : null}

      {step === 'additional' ? (
        <Card>
          <CardHeader
            title="Step 3 - Additional information"
            description="Optional details that help students decide whether the course is right for them."
          />
          <CardBody>
            <form action={updateCourseAdditionalAction} className="space-y-4">
              <input type="hidden" name="id" value={course.id} />
              <Field
                label="What will I learn?"
                hint="Add one outcome per line. Shown as a checklist on the course page."
              >
                <Textarea
                  name="learning_outcomes"
                  defaultValue={course.learning_outcomes ?? ''}
                  className="min-h-28"
                  placeholder={'Build responsive pages\nStyle layouts with modern CSS'}
                />
              </Field>
              <Field label="Target audience">
                <Textarea
                  name="target_audience"
                  defaultValue={course.target_audience ?? ''}
                  placeholder="Beginners, career switchers, and anyone who wants to learn web development."
                />
              </Field>
              <Field label="Course duration" hint="For example: 6 weeks, 12 hours, or self-paced.">
                <Input name="duration_label" defaultValue={course.duration_label ?? ''} />
              </Field>
              <Field label="Materials included" hint="One item per line.">
                <Textarea
                  name="materials_included"
                  defaultValue={course.materials_included ?? ''}
                  placeholder={'Downloadable slides\nPractice files\nCertificate of completion'}
                />
              </Field>
              <Field label="Requirements / instructions" hint="One requirement per line.">
                <Textarea
                  name="requirements"
                  defaultValue={course.requirements ?? ''}
                  placeholder={'A computer with internet access\nNo prior experience needed'}
                />
              </Field>
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <SubmitButton pendingLabel="Saving...">Save additional information</SubmitButton>
                <Link
                  href={`/dashboard/courses/${course.id}/setup?step=basic`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Back to basic setup
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

async function CurriculumStep({ course }: { course: Course }) {
  const supabase = createClient();
  const [sectionsRes, lessonsRes, assessmentsRes] = await Promise.all([
    supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order'),
    supabase.from('lessons').select('*').eq('course_id', course.id).order('sort_order'),
    supabase.from('assessments').select('*').eq('course_id', course.id),
  ]);

  const sections = (sectionsRes.data as CourseSection[]) ?? [];
  const lessons = (lessonsRes.data as Lesson[]) ?? [];
  const assessments = (assessmentsRes.data as Assessment[]) ?? [];
  const curriculumAssessments = assessments.filter((item) => item.section_id);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Step 2 - Curriculum"
          description="Add topics (sections), then add lessons, quizzes and assignments inside each topic."
        />
        <CardBody>
          <form action={createSectionAction} className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="course_id" value={course.id} />
            <Field label="Topic title">
              <Input name="title" required placeholder="e.g. Getting started" />
            </Field>
            <Field label="Sort order">
              <Input name="sort_order" type="number" defaultValue={sections.length} />
            </Field>
            <Field label="Free preview">
              <Select name="is_free" defaultValue="off">
                <option value="off">No</option>
                <option value="on">Yes</option>
              </Select>
            </Field>
            <div className="flex items-end">
              <SubmitButton pendingLabel="Adding...">Add topic</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      {sections.length === 0 ? (
        <EmptyState
          title="No topics yet"
          description="Add your first topic above, then add lessons, quizzes and assignments."
        />
      ) : (
        sections.map((section) => {
          const sectionLessons = lessons
            .filter((lesson) => lesson.section_id === section.id)
            .map<CurriculumEntry>((lesson) => ({
              id: lesson.id,
              kind: 'lesson',
              title: lesson.title,
              type: lesson.type,
              meta: [
                lesson.duration_min ? `${lesson.duration_min} min` : null,
                lesson.is_preview ? 'preview' : null,
              ]
                .filter(Boolean)
                .join(' - '),
              sortOrder: lesson.sort_order,
            }));
          const sectionAssessments = curriculumAssessments
            .filter((item) => item.section_id === section.id)
            .map<CurriculumEntry>((item) => ({
              id: item.id,
              kind: 'assessment',
              title: item.title,
              type: item.type,
              meta: [
                `${item.total_marks} marks`,
                item.due_at ? `due ${formatDate(item.due_at)}` : null,
                item.is_published ? 'published' : 'draft',
              ]
                .filter(Boolean)
                .join(' - '),
              sortOrder: item.sort_order,
            }));

          const entries = [...sectionLessons, ...sectionAssessments].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
          );

          return (
            <Card key={section.id}>
              <CardHeader
                title={section.title}
                description={`${entries.length} items`}
                action={
                  <div className="flex items-center gap-2">
                    {section.is_free ? <Badge tone="green">Free</Badge> : null}
                    <form action={deleteSectionAction}>
                      <input type="hidden" name="id" value={section.id} />
                      <input type="hidden" name="course_id" value={course.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Delete topic
                      </Button>
                    </form>
                  </div>
                }
              />
              <CardBody className="space-y-4">
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {entries.map((entry) => (
                    <li key={`${entry.kind}-${entry.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-800">{entry.title}</p>
                        <p className="text-xs text-slate-400">
                          {entry.kind === 'assessment' ? entry.type : entry.type}
                          {entry.meta ? ` - ${entry.meta}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            entry.type === 'quiz'
                              ? 'violet'
                              : entry.type === 'assignment'
                                ? 'amber'
                                : entry.kind === 'assessment'
                                  ? 'blue'
                                  : 'slate'
                          }
                        >
                          {entry.type}
                        </Badge>
                        <form action={deleteCurriculumItemAction}>
                          <input type="hidden" name="id" value={entry.id} />
                          <input type="hidden" name="course_id" value={course.id} />
                          <input type="hidden" name="kind" value={entry.kind} />
                          <Button type="submit" size="sm" variant="danger">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </li>
                  ))}
                  {entries.length === 0 ? (
                    <li className="px-4 py-3 text-xs text-slate-400">No items in this topic yet.</li>
                  ) : null}
                </ul>

                <CurriculumItemForm
                  courseId={course.id}
                  sectionId={section.id}
                  nextSortOrder={entries.length}
                />
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
