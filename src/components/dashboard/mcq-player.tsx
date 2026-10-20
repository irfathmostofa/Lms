'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { submitQuizAction } from '@/actions/student';
import { quizOptionEntries } from '@/lib/quiz';
import type { QuizPaperQuestion } from '@/lib/types';

function Submit({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'Submitting...' : 'Submit quiz'}
    </Button>
  );
}

function formatRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function McqPlayer({
  assessmentId,
  questions,
  timeLimitMinutes,
}: {
  assessmentId: string;
  questions: QuizPaperQuestion[];
  timeLimitMinutes?: number | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, formAction] = useFormState(submitQuizAction, null);
  const [remaining, setRemaining] = useState(
    timeLimitMinutes && timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const expired = remaining === 0;

  useEffect(() => {
    if (remaining == null) return;
    if (remaining <= 0) {
      if (!submittedRef.current && Object.keys(answersRef.current).length > 0) {
        submittedRef.current = true;
        formRef.current?.requestSubmit();
      }
      return;
    }
    const timer = window.setTimeout(() => setRemaining((value) => (value == null ? value : value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  useEffect(() => {
    if (state?.success) submittedRef.current = true;
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="assessment_id" value={assessmentId} />
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          {answered} of {questions.length} answered. Choose one option per question.
        </p>
        {remaining != null ? (
          <p className={`font-semibold ${remaining <= 30 ? 'text-red-600' : 'text-slate-700'}`}>
            Time left: {formatRemaining(remaining)}
            {expired ? ' · submitting' : ''}
          </p>
        ) : null}
      </div>

      {questions.map((question, index) => {
        const options = quizOptionEntries(question);
        return (
          <fieldset key={question.id} className="rounded-xl border border-slate-200 p-4" disabled={expired}>
            <legend className="text-sm font-semibold text-slate-900">
              {index + 1}. {question.prompt}
              <span className="ml-2 text-xs font-normal text-slate-400">{question.marks} marks</span>
            </legend>
            <div className="mt-3 space-y-2">
              {options.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={option.key}
                    checked={answers[question.id] === option.key}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.key }))}
                    className="mt-1"
                    disabled={expired}
                  />
                  <span>
                    <span className="font-semibold text-slate-700">{option.key}.</span> {option.text}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      <Submit disabled={expired && answered === 0} />
    </form>
  );
}
