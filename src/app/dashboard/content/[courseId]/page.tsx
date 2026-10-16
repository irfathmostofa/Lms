import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createLessonAction, createSectionAction, deleteLessonAction } from '@/actions/dashboard';
import {
  Badge,
  Button,
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
import type { Course, CourseSection, Lesson } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CurriculumPage({ params }: { params: { courseId: string } }) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'editor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.courseId)
    .maybeSingle();
  if (!course) notFound();

  const [sectionsRes, lessonsRes] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', params.courseId).order('sort_order'),
    supabase.from('lessons').select('*').eq('course_id', params.courseId).order('sort_order'),
  ]);

  const sections = (sectionsRes.data as CourseSection[]) ?? [];
  const lessons = (lessonsRes.data as Lesson[]) ?? [];
  const typedCourse = course as Course;

  return (
    <>
      <PageHeader
        title={`Curriculum: ${typedCourse.title}`}
        description="Add sections, then add lessons inside each section."
      />

      <Card className="mb-6">
        <CardHeader title="Add section" />
        <CardBody>
          <form action={createSectionAction} className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="course_id" value={typedCourse.id} />
            <Field label="Title">
              <Input name="title" required />
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
              <SubmitButton pendingLabel="Adding...">Add section</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      {sections.length === 0 ? (
        <EmptyState title="No sections yet" description="Add your first section above." />
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);
            return (
              <Card key={section.id}>
                <CardHeader
                  title={section.title}
                  description={`${sectionLessons.length} lessons`}
                  action={section.is_free ? <Badge tone="green">Free</Badge> : null}
                />
                <CardBody className="space-y-4">
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {sectionLessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-800">{lesson.title}</p>
                          <p className="text-xs text-slate-400">
                            {lesson.type}
                            {lesson.is_preview ? ' - preview' : ''}
                          </p>
                        </div>
                        <form action={deleteLessonAction}>
                          <input type="hidden" name="id" value={lesson.id} />
                          <input type="hidden" name="course_id" value={typedCourse.id} />
                          <Button type="submit" size="sm" variant="danger">
                            Delete
                          </Button>
                        </form>
                      </li>
                    ))}
                    {sectionLessons.length === 0 ? (
                      <li className="px-4 py-3 text-xs text-slate-400">No lessons yet.</li>
                    ) : null}
                  </ul>

                  <form action={createLessonAction} className="grid gap-3 sm:grid-cols-3">
                    <input type="hidden" name="section_id" value={section.id} />
                    <input type="hidden" name="course_id" value={typedCourse.id} />
                    <Field label="Lesson title">
                      <Input name="title" required />
                    </Field>
                    <Field label="Type">
                      <Select name="type" defaultValue="text">
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="pdf">PDF</option>
                        <option value="youtube">YouTube</option>
                        <option value="link">Link</option>
                      </Select>
                    </Field>
                    <Field label="Duration (min)">
                      <Input name="duration_min" type="number" min="0" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Media / file URL" hint="For images, PDFs or external links.">
                        <Input name="media_url" />
                      </Field>
                    </div>
                    <Field label="YouTube video ID">
                      <Input name="youtube_id" placeholder="dQw4w9WgXcQ" />
                    </Field>
                    <div className="sm:col-span-3">
                      <Field label="Text content">
                        <Textarea name="content" />
                      </Field>
                    </div>
                    <Field label="Sort order">
                      <Input name="sort_order" type="number" defaultValue={sectionLessons.length} />
                    </Field>
                    <Field label="Preview">
                      <Select name="is_preview" defaultValue="off">
                        <option value="off">No</option>
                        <option value="on">Yes</option>
                      </Select>
                    </Field>
                    <div className="flex items-end">
                      <SubmitButton pendingLabel="Adding...">Add lesson</SubmitButton>
                    </div>
                  </form>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
