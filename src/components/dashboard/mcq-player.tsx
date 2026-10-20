'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { submitQuizAction } from '@/actions/student';
import { quizOptionEntries } from '@/lib/quiz';
import type { QuizPaperQuestion } from '@/lib/types';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit quiz'}
    </Button>
  );
}

export function McqPlayer({
  assessmentId,
  questions,
}: {
  assessmentId: string;
  questions: QuizPaperQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, formAction] = useFormState(submitQuizAction, null);
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <form action={formAction} className="space-y-4">
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

      <p className="text-xs text-slate-500">
        {answered} of {questions.length} answered. Choose one option per question.
      </p>

      {questions.map((question, index) => {
        const options = quizOptionEntries(question);
        return (
          <fieldset key={question.id} className="rounded-xl border border-slate-200 p-4">
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

      <Submit />
    </form>
  );
}
