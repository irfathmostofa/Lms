import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
import { CourseBasicForm } from '@/components/dashboard/course-basic-form';
import { CourseSetupSteps } from '@/components/dashboard/course-setup-steps';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

const errors: Record<string, string> = {
  title: 'A course title is required.',
  slug: 'That slug is already used by another course.',
  password: 'Add an access password for a password-protected course.',
  image: 'Use a JPG, PNG or WebP image up to 5 MB.',
  upload: 'The image could not be uploaded. Check the thumbnails storage bucket.',
  save: 'The course could not be saved. Please try again.',
};

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'editor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();
  const [categoriesRes, authorsRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('role', ['admin', 'instructor', 'editor'])
      .order('full_name'),
  ]);

  const categories = (categoriesRes.data as Category[]) ?? [];
  const authors = (authorsRes.data as { id: string; full_name: string | null; email: string | null }[]) ?? [];

  return (
    <>
      <PageHeader
        title="Create course"
        description="Step 1 of 3: set up the essentials, then build the curriculum and add optional details."
      />
      <CourseSetupSteps current="basic" isNew />

      {searchParams.error && errors[searchParams.error] ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors[searchParams.error]}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Basic setup"
          description="Only the title is required. You can change everything later."
        />
        <CardBody>
          <CourseBasicForm
            categories={categories.map((category) => ({ id: category.id, name: category.name }))}
            authors={authors.map((author) => ({
              id: author.id,
              name: author.full_name ?? author.email ?? 'Unnamed',
            }))}
            currentUserId={ctx?.userId ?? ''}
          />
        </CardBody>
      </Card>
    </>
  );
}
