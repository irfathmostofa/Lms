'use client';

import { useState } from 'react';
import { createCurriculumItemAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { McqBuilder } from '@/components/dashboard/mcq-builder';
import { emptyQuizQuestion } from '@/lib/quiz';
import type { AssessmentDelivery, QuizQuestion } from '@/lib/types';

type ItemType = 'lesson' | 'quiz' | 'assignment';
type LessonFormat = 'text' | 'youtube' | 'pdf' | 'image' | 'link';

export function CurriculumItemForm({
  courseId,
  sectionId,
  nextSortOrder,
}: {
  courseId: string;
  sectionId: string;
  nextSortOrder: number;
}) {
  const [itemType, setItemType] = useState<ItemType>('lesson');
  const [lessonType, setLessonType] = useState<LessonFormat>('text');
  const [delivery, setDelivery] = useState<AssessmentDelivery>('online');
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuizQuestion(0)]);

  return (
    <form action={createCurriculumItemAction} className="rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="section_id" value={sectionId} />
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Add item</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Item type">
          <Select name="item_type" value={itemType} onChange={(event) => setItemType(event.target.value as ItemType)}>
            <option value="lesson">Lesson</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
          </Select>
        </Field>
        <Field label="Title">
          <Input name="title" required />
        </Field>

        {itemType === 'lesson' ? (
          <>
            <Field label="Lesson format">
              <Select
                name="lesson_type"
                value={lessonType}
                onChange={(event) => setLessonType(event.target.value as LessonFormat)}
              >
                <option value="text">Text</option>
                <option value="youtube">YouTube video</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="link">External link</option>
              </Select>
            </Field>
            <Field label="Duration (minutes)">
              <Input name="duration_min" type="number" min="0" />
            </Field>
            {lessonType === 'youtube' ? (
              <div className="sm:col-span-2">
                <Field label="YouTube link or video ID">
                  <Input name="youtube_id" placeholder="https://youtu.be/dQw4w9WgXcQ" />
                </Field>
              </div>
            ) : null}
            {['pdf', 'image', 'link'].includes(lessonType) ? (
              <div className="sm:col-span-2">
                <Field label="Media / file URL">
                  <Input name="media_url" type="url" />
                </Field>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <Field label="Lesson content">
                <Textarea name="content" placeholder="Notes or text shown with this lesson." />
              </Field>
            </div>
            <Field label="Free preview">
              <Select name="is_preview" defaultValue="off">
                <option value="off">No</option>
                <option value="on">Yes</option>
              </Select>
            </Field>
          </>
        ) : (
          <>
            <Field label="How will students take this?">
              <Select
                name="delivery_mode"
                value={delivery}
                onChange={(event) => setDelivery(event.target.value as AssessmentDelivery)}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </Select>
            </Field>
            {itemType === 'quiz' ? (
              <div className="sm:col-span-2">
                <McqBuilder questions={questions} onChange={setQuestions} />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <Field label="Assignment brief">
                  <Textarea
                    name="instructions"
                    required={delivery === 'online'}
                    placeholder="Describe the file students must upload, or how offline work is collected."
                  />
                </Field>
              </div>
            )}
            {itemType !== 'quiz' ? (
              <Field label="Total marks">
                <Input name="total_marks" type="number" min="0" step="0.01" defaultValue="100" required />
              </Field>
            ) : null}
            <Field label="Pass marks">
              <Input name="pass_marks" type="number" min="0" step="0.01" />
            </Field>
            <Field label={itemType === 'assignment' ? 'Due date' : 'Due date (optional)'}>
              <Input name="due_at" type="datetime-local" required={itemType === 'assignment'} />
            </Field>
            <Field label="Publish now">
              <Select name="is_published" defaultValue="off">
                <option value="off">Save as draft</option>
                <option value="on">Publish</option>
              </Select>
            </Field>
          </>
        )}

        <Field label="Sort order">
          <Input name="sort_order" type="number" defaultValue={nextSortOrder} />
        </Field>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Adding...">Add to topic</SubmitButton>
        </div>
      </div>
    </form>
  );
}
