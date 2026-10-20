'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { submitAssessmentAction } from '@/actions/student';
import { McqPlayer } from '@/components/dashboard/mcq-player';
import { assessmentTypeConfig, resolveDelivery } from '@/lib/assessments';
import type { AssessmentDelivery, AssessmentType, QuizPaperQuestion } from '@/lib/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function SubmissionForm({
  assessmentId,
  type,
  deliveryMode,
  questions = [],
  existingContent,
  existingFileUrl,
  readOnly,
}: {
  assessmentId: string;
  type: AssessmentType;
  deliveryMode?: AssessmentDelivery | null;
  questions?: QuizPaperQuestion[];
  existingContent?: string | null;
  existingFileUrl?: string | null;
  readOnly?: boolean;
}) {
  const [state, formAction] = useFormState(submitAssessmentAction, null);
  const config = assessmentTypeConfig(type);
  const delivery = resolveDelivery(type, deliveryMode);

  if (delivery === 'offline' || config.studentOnlineMode === 'none') {
    return (
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        This {config.label.toLowerCase()} is offline. You do not submit in the portal. Marks appear
        here after your instructor grades it.
      </div>
    );
  }

  if (config.studentOnlineMode === 'mcq') {
    if (readOnly) {
      return (
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Your MCQ answers were submitted. The score above is auto-graded.
        </div>
      );
    }
    if (questions.length === 0) {
      return (
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          This quiz has no questions yet.
        </div>
      );
    }
    return <McqPlayer assessmentId={assessmentId} questions={questions} />;
  }

  if (readOnly) {
    return (
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        {existingContent ? <p className="whitespace-pre-line">{existingContent}</p> : <p>Submitted.</p>}
        {existingFileUrl ? (
          <a
            href={existingFileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-brand-600 hover:underline"
          >
            Attachment
          </a>
        ) : null}
        <p className="mt-2 text-slate-400">This assessment is graded and can no longer be edited.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
      <input type="hidden" name="assessment_id" value={assessmentId} />

      {config.studentOnlineMode === 'text_file' ? (
        <Field label="Your answer">
          <Textarea
            name="content"
            required
            defaultValue={existingContent ?? ''}
            className="min-h-[80px]"
          />
        </Field>
      ) : null}

      {config.studentOnlineMode === 'file' ? (
        <Field label="Notes (optional)">
          <Textarea name="content" defaultValue={existingContent ?? ''} className="min-h-[60px]" />
        </Field>
      ) : null}

      {config.studentOnlineMode === 'file' || config.studentOnlineMode === 'text_file' ? (
        <Field label={config.studentOnlineMode === 'file' ? 'Work file URL' : 'Attachment URL (optional)'}>
          <Input
            name="file_url"
            type="url"
            required={config.studentOnlineMode === 'file'}
            defaultValue={existingFileUrl ?? ''}
            placeholder="https://..."
          />
        </Field>
      ) : null}

      <Submit label={config.studentOnlineMode === 'file' ? 'Submit assignment' : 'Submit homework'} />
    </form>
  );
}
