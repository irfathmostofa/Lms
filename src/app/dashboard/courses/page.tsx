import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { createCourseAction, setCourseStatusAction } from '@/actions/dashboard';
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
  Table,
  Td,
  Th,
  Textarea,
} from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Category, Course } from '@/lib/types';

export const dynamic = 'force-dynamic';

const statusTone: Record<string, 'slate' | 'amber' | 'green' | 'violet'> = {
  draft: 'slate',
  review: 'amber',
  published: 'green',
  archived: 'violet',
};

export default async function CoursesAdminPage() {
  const ctx = await getSessionContext();
  const role = ctx?.profile?.role ?? 'student';
  if (!['admin', 'editor', 'instructor'].includes(role)) redirect('/dashboard');

  const supabase = createClient();

  const [coursesRes, categoriesRes] = await Promise.all([
    supabase.from('courses').select('*').order('updated_at', { ascending: false }).limit(100),
    supabase.from('categories').select('*').order('name'),
  ]);

  const courses = (coursesRes.data as Course[]) ?? [];
  const categories = (categoriesRes.data as Category[]) ?? [];
  const isAdmin = role === 'admin';

  return (
    <>
      <PageHeader
        title="Courses"
        description="Create courses, move them through review, and publish (admin only)."
      />

      {['admin', 'editor'].includes(role) ? (
        <Card className="mb-6">
          <CardHeader title="New course" description="Created as a draft. Submit for review when ready." />
          <CardBody>
            <form action={createCourseAction} className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input name="title" required />
              </Field>
              <Field label="Slug" hint="Leave blank to auto-generate from the title.">
                <Input name="slug" />
              </Field>
              <Field label="Category">
                <Select name="category_id" defaultValue="">
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mode">
                <Select name="mode" defaultValue="online">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </Select>
              </Field>
              <Field label="Price (BDT)">
                <Input name="price" type="number" min="0" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Discount price (BDT)">
                <Input name="discount_price" type="number" min="0" step="0.01" />
              </Field>
              <Field label="Level">
                <Input name="level" placeholder="Beginner / Intermediate / Advanced" />
              </Field>
              <Field label="Duration (hours)">
                <Input name="duration_hours" type="number" min="0" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Summary">
                  <Input name="summary" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea name="description" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Creating...">Create course</SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="All courses" description={`${courses.length} courses`} />
        <CardBody className="p-0">
          {courses.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No courses yet" />
            </div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th>Mode</Th>
                  <Th>Status</Th>
                  <Th>Price</Th>
                  <Th>Updated</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <Td>
                      <span className="font-medium text-slate-900">{course.title}</span>
                      <span className="ml-2 font-mono text-xs text-slate-400">{course.slug}</span>
                    </Td>
                    <Td>
                      <Badge>{course.mode}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone[course.status]}>{course.status}</Badge>
                    </Td>
                    <Td>{formatCurrency(course.discount_price ?? course.price)}</Td>
                    <Td className="text-xs text-slate-500">{formatDate(course.updated_at)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {course.status !== 'review' && course.status !== 'published' ? (
                          <form action={setCourseStatusAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="status" value="review" />
                            <Button type="submit" size="sm" variant="secondary">
                              Submit for review
                            </Button>
                          </form>
                        ) : null}
                        {isAdmin && course.status !== 'published' ? (
                          <form action={setCourseStatusAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="status" value="published" />
                            <Button type="submit" size="sm" variant="success">
                              Publish
                            </Button>
                          </form>
                        ) : null}
                        {isAdmin && course.status === 'published' ? (
                          <form action={setCourseStatusAction}>
                            <input type="hidden" name="id" value={course.id} />
                            <input type="hidden" name="status" value="archived" />
                            <Button type="submit" size="sm" variant="outline">
                              Archive
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
