'use client';

import { useState } from 'react';
import { createCourseAction, updateCourseBasicAction } from '@/actions/dashboard';
import { Field, Input, Select } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { ImageUpload } from '@/components/dashboard/image-upload';
import { toDateTimeLocal } from '@/lib/utils';
import type { Course, CourseMode, CourseVisibility } from '@/lib/types';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface AuthorOption {
  id: string;
  name: string;
}

export function CourseBasicForm({
  course,
  categories,
  authors,
  currentUserId,
  hasPassword = false,
}: {
  course?: Course | null;
  categories: CategoryOption[];
  authors: AuthorOption[];
  currentUserId: string;
  hasPassword?: boolean;
}) {
  const [visibility, setVisibility] = useState<CourseVisibility>(course?.visibility ?? 'public');
  const [pricing, setPricing] = useState<'free' | 'paid'>(
    course && Number(course.price) > 0 ? 'paid' : 'free',
  );
  const [thumbnail, setThumbnail] = useState(course?.thumbnail_url ?? '');
  const action = course ? updateCourseBasicAction : createCourseAction;

  return (
    <form action={action} className="space-y-6">
      {course ? <input type="hidden" name="id" value={course.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Course title">
            <Input name="title" defaultValue={course?.title ?? ''} required />
          </Field>
        </div>
        <Field label="Slug" hint="Leave blank to generate it from the title.">
          <Input name="slug" defaultValue={course?.slug ?? ''} />
        </Field>
        <Field label="Short summary" hint="One line shown on course cards.">
          <Input name="summary" defaultValue={course?.summary ?? ''} />
        </Field>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
        <RichTextEditor
          name="description"
          defaultValue={course?.description ?? ''}
          placeholder="Describe what this course covers..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Visibility">
          <Select
            name="visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as CourseVisibility)}
          >
            <option value="public">Public - listed in the catalog</option>
            <option value="password">Password protected</option>
            <option value="private">Private - hidden from the catalog</option>
          </Select>
        </Field>

        {visibility === 'password' ? (
          <Field
            label="Access password"
            hint={
              hasPassword
                ? 'Leave blank to keep the current password.'
                : 'Students must enter this password to open the course.'
            }
          >
            <Input
              name="access_password"
              type="password"
              autoComplete="new-password"
              required={!hasPassword}
            />
          </Field>
        ) : (
          <Field label="Publish schedule" hint="Optional planned publish date and time.">
            <Input
              name="scheduled_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(course?.scheduled_at)}
            />
          </Field>
        )}

        {visibility === 'password' ? (
          <Field label="Publish schedule" hint="Optional planned publish date and time.">
            <Input
              name="scheduled_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(course?.scheduled_at)}
            />
          </Field>
        ) : null}

        <Field label="Category">
          <Select name="category_id" defaultValue={course?.category_id ?? ''}>
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Author">
          <Select name="author_id" defaultValue={course?.author_id ?? currentUserId}>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tags" hint="Separate tags with commas.">
          <Input name="tags" defaultValue={(course?.tags ?? []).join(', ')} placeholder="html, css, beginner" />
        </Field>

        <Field label="Delivery mode">
          <Select name="mode" defaultValue={course?.mode ?? ('online' as CourseMode)}>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </Select>
        </Field>
      </div>

      <div className="space-y-3">
        <Field label="Featured image URL" hint="Paste a URL, or upload below. Uploads are compressed to 75% quality.">
          <Input name="thumbnail_url" value={thumbnail} onChange={(event) => setThumbnail(event.target.value)} />
        </Field>
        <ImageUpload
          label="Upload image"
          fileName="thumbnail_file"
          previewUrl={thumbnail}
          maxWidth={1600}
          maxHeight={900}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Intro video link"
          hint="YouTube watch, share, shorts or embed link, or a video ID."
        >
          <Input
            name="promo_video_id"
            defaultValue={course?.promo_video_id ?? ''}
            placeholder="https://youtu.be/dQw4w9WgXcQ"
          />
        </Field>
        <Field label="Pricing">
          <Select
            name="pricing"
            value={pricing}
            onChange={(event) => setPricing(event.target.value as 'free' | 'paid')}
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </Select>
        </Field>
        {pricing === 'paid' ? (
          <>
            <Field label="Price (BDT)">
              <Input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={course?.price ?? 0}
              />
            </Field>
            <Field label="Discount price (BDT)" hint="Optional.">
              <Input
                name="discount_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={course?.discount_price ?? ''}
              />
            </Field>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <SubmitButton pendingLabel="Saving...">
          Save and continue to curriculum
        </SubmitButton>
        <SubmitButton variant="secondary" name="next" value="additional" pendingLabel="Saving...">
          Save and go to additional
        </SubmitButton>
        {course ? (
          <span className="text-xs text-slate-400">
            Status: {course.status}. Publish from the courses list when ready.
          </span>
        ) : null}
      </div>
    </form>
  );
}
