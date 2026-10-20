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
import { FormModal } from '@/components/dashboard/form-modal';
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
            action={
              <FormModal title="Edit basic setup" triggerLabel="Edit details" size="xl">
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
              </FormModal>
            }
          />
          <CardBody className="space-y-4 text-sm text-slate-600">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Title</p>
                <p className="mt-1 text-slate-800">{course.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Slug</p>
                <p className="mt-1 text-slate-800">{course.slug}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Summary</p>
                <p className="mt-1 text-slate-800">{course.summary || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Visibility</p>
                <p className="mt-1 capitalize text-slate-800">{course.visibility}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Price</p>
                <p className="mt-1 text-slate-800">{Number(course.price) > 0 ? course.price : 'Free'}</p>
              </div>
            </div>
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
            action={
              <FormModal title="Edit additional information" triggerLabel="Edit details" size="xl">
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
                  <SubmitButton pendingLabel="Saving...">Save additional information</SubmitButton>
                </form>
              </FormModal>
            }
          />
          <CardBody className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">What will I learn?</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-800">{course.learning_outcomes || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Target audience</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-800">{course.target_audience || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Duration</p>
              <p className="mt-1 text-slate-800">{course.duration_label || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Materials included</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-800">{course.materials_included || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Requirements</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-800">{course.requirements || '-'}</p>
            </div>
            <Link
              href={`/dashboard/courses/${course.id}/setup?step=basic`}
              className="inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              Back to basic setup
            </Link>
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
          <FormModal title="Add topic" description="Create a section, then add lessons, quizzes and assignments inside it." triggerLabel="Add topic">
            <form action={createSectionAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="course_id" value={course.id} />
              <div className="sm:col-span-2">
                <Field label="Topic title">
                  <Input name="title" required placeholder="e.g. Getting started" />
                </Field>
              </div>
              <Field label="Sort order">
                <Input name="sort_order" type="number" defaultValue={sections.length} />
              </Field>
              <Field label="Free preview">
                <Select name="is_free" defaultValue="off">
                  <option value="off">No</option>
                  <option value="on">Yes</option>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Adding...">Add topic</SubmitButton>
              </div>
            </form>
          </FormModal>
        </CardBody>
      </Card>

      {sections.length === 0 ? (
        <EmptyState
          title="No topics yet"
          description="Use Add topic to create your first section, then add lessons, quizzes and assignments."
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
                item.delivery_mode ?? 'online',
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

                <FormModal
                  title={`Add item to ${section.title}`}
                  triggerLabel="Add item"
                  triggerVariant="secondary"
                  triggerSize="sm"
                  size="xl"
                >
                  <CurriculumItemForm
                    courseId={course.id}
                    sectionId={section.id}
                    nextSortOrder={entries.length}
                  />
                </FormModal>
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
