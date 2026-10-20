'use client';

import { useFormState } from 'react-dom';
import { useMemo, useState } from 'react';
import { createAssessmentAction, updateAssessmentAction } from '@/actions/dashboard';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/dashboard/submit-button';
import { McqBuilder } from '@/components/dashboard/mcq-builder';
import { ASSESSMENT_TYPES, assessmentTypeConfig, resolveDelivery } from '@/lib/assessments';
import { emptyQuizQuestion } from '@/lib/quiz';
import { toDateTimeLocal } from '@/lib/utils';
import type { Assessment, AssessmentDelivery, AssessmentType, QuizQuestion } from '@/lib/types';

export function AssessmentForm({
  courses,
  batches,
  assessment,
  questions: initialQuestions,
}: {
  courses: { id: string; title: string }[];
  batches: { id: string; name: string; course_id: string | null }[];
  assessment?: Assessment;
  questions?: QuizQuestion[];
}) {
  const action = assessment ? updateAssessmentAction : createAssessmentAction;
  const [state, formAction] = useFormState(action, null);
  const [type, setType] = useState<AssessmentType>(assessment?.type ?? 'homework');
  const [delivery, setDelivery] = useState<AssessmentDelivery>(
    resolveDelivery(assessment?.type ?? 'homework', assessment?.delivery_mode),
  );
  const [courseId, setCourseId] = useState(assessment?.course_id ?? '');
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [emptyQuizQuestion(0)],
  );
  const config = assessmentTypeConfig(type);
  const mode = resolveDelivery(type, delivery);
  const editing = Boolean(assessment);

  const visibleBatches = useMemo(
    () => batches.filter((batch) => !courseId || !batch.course_id || batch.course_id === courseId),
    [batches, courseId],
  );

  function changeType(next: AssessmentType) {
    const nextConfig = assessmentTypeConfig(next);
    setType(next);
    setDelivery(nextConfig.defaultDelivery);
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      {assessment ? <input type="hidden" name="id" value={assessment.id} /> : null}
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-3">
          {state.success}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Field label="Title">
          <Input name="title" required defaultValue={assessment?.title ?? ''} placeholder={`${config.label} title`} />
        </Field>
      </div>
      <Field label="Type">
        <Select name="type" value={type} onChange={(event) => changeType(event.target.value as AssessmentType)}>
          {ASSESSMENT_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="sm:col-span-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {config.description} {config.targetHint}
      </div>

      {config.allowDeliveryChoice ? (
        <Field label="How will students take this?">
          <Select
            name="delivery_mode"
            value={mode}
            onChange={(event) => setDelivery(event.target.value as AssessmentDelivery)}
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="delivery_mode" value={mode} />
      )}

      <Field label={config.requireCourse ? 'Course' : 'Course (optional)'}>
        <Select
          name="course_id"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          required={config.requireCourse}
        >
          <option value="">{config.requireCourse ? 'Select a course' : 'None'}</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Batch (optional)">
        <Select name="batch_id" defaultValue={assessment?.batch_id ?? ''}>
          <option value="">None</option>
          {visibleBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={config.requireDue ? 'Due date' : 'Due date (optional)'}>
        <Input
          name="due_at"
          type="datetime-local"
          required={config.requireDue}
          defaultValue={toDateTimeLocal(assessment?.due_at)}
        />
      </Field>

      {mode === 'offline' ? (
        <div className="sm:col-span-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Offline {config.label.toLowerCase()}: students do not submit in the portal.
          {type === 'homework'
            ? ' Track submitted or not submitted after collection.'
            : type === 'quiz'
              ? ' Scores come from the paper attempt; add remarks after.'
              : ' Enter marks after collection.'}
        </div>
      ) : null}

      {type === 'quiz' ? (
        <>
          <Field label="Timer (minutes)">
            <Input
              name="time_limit_minutes"
              type="number"
              min="1"
              step="1"
              defaultValue={assessment?.time_limit_minutes ?? ''}
              placeholder="e.g. 20"
            />
          </Field>
          <div className="sm:col-span-3">
            <McqBuilder questions={questions} onChange={setQuestions} />
          </div>
        </>
      ) : (
        <div className="sm:col-span-3">
          <Field label={mode === 'online' ? 'Instructions' : 'Notes for staff (optional)'}>
            <Textarea
              name="instructions"
              required={mode === 'online'}
              defaultValue={assessment?.instructions ?? ''}
              placeholder={
                type === 'assignment'
                  ? 'Describe the file students must upload, or how offline work is collected.'
                  : 'What should students complete?'
              }
            />
          </Field>
        </div>
      )}

      {type !== 'quiz' && type !== 'homework' ? (
        <Field label="Total marks">
          <Input
            name="total_marks"
            type="number"
            min="0"
            step="0.01"
            defaultValue={assessment?.total_marks ?? 100}
            required
          />
        </Field>
      ) : null}
      {type !== 'homework' ? (
        <Field label="Pass marks">
          <Input
            name="pass_marks"
            type="number"
            min="0"
            step="0.01"
            defaultValue={assessment?.pass_marks ?? ''}
          />
        </Field>
      ) : null}
      <Field label="Publish now">
        <Select name="is_published" defaultValue={assessment?.is_published ? 'on' : 'off'}>
          <option value="off">Save as draft</option>
          <option value="on">Publish</option>
        </Select>
      </Field>
      <div className="sm:col-span-3">
        <SubmitButton pendingLabel={editing ? 'Saving...' : 'Creating...'}>
          {editing ? `Save ${config.label.toLowerCase()}` : `Create ${config.label.toLowerCase()}`}
        </SubmitButton>
      </div>
    </form>
  );
}
