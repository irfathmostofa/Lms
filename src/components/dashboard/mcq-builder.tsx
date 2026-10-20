'use client';

import { useMemo } from 'react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { emptyQuizQuestion, quizTotalMarks } from '@/lib/quiz';
import type { QuizOptionKey, QuizQuestion } from '@/lib/types';

const OPTION_KEYS: QuizOptionKey[] = ['A', 'B', 'C', 'D', 'E'];

export function McqBuilder({
  questions,
  onChange,
  name = 'quiz_questions',
}: {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  name?: string;
}) {
  const total = useMemo(() => quizTotalMarks(questions), [questions]);

  function update(index: number, patch: Partial<QuizQuestion>) {
    onChange(questions.map((question, current) => (current === index ? { ...question, ...patch } : question)));
  }

  function remove(index: number) {
    onChange(questions.filter((_, current) => current !== index));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(questions)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">MCQ paper</p>
        <p className="text-xs text-slate-500">
          {questions.length} questions · {total} marks
        </p>
      </div>
      <p className="text-xs text-slate-500">
        Traditional 4/5-option questions. Mark one correct answer. This paper is also used inside courses.
      </p>

      {questions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No questions yet. Add the first MCQ.
        </p>
      ) : null}

      {questions.map((question, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">Question {index + 1}</p>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
          <Field label="Prompt">
            <Textarea
              value={question.prompt}
              onChange={(event) => update(index, { prompt: event.target.value })}
              required
              className="min-h-[72px]"
              placeholder="Write the question stem."
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTION_KEYS.map((key) => {
              const field = `option_${key.toLowerCase()}` as
                | 'option_a'
                | 'option_b'
                | 'option_c'
                | 'option_d'
                | 'option_e';
              const required = key === 'A' || key === 'B';
              return (
                <Field key={key} label={`Option ${key}${required ? '' : ' (optional)'}`}>
                  <Input
                    value={question[field]}
                    onChange={(event) => update(index, { [field]: event.target.value })}
                    required={required}
                    placeholder={`${key}.`}
                  />
                </Field>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Correct answer">
              <Select
                value={question.correct_option}
                onChange={(event) => update(index, { correct_option: event.target.value as QuizOptionKey })}
              >
                {OPTION_KEYS.filter((key) => {
                  const field = `option_${key.toLowerCase()}` as
                    | 'option_a'
                    | 'option_b'
                    | 'option_c'
                    | 'option_d'
                    | 'option_e';
                  return key === 'A' || key === 'B' || Boolean(question[field]);
                }).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Marks">
              <Input
                type="number"
                min="0.25"
                step="0.25"
                value={question.marks}
                onChange={(event) => update(index, { marks: Number(event.target.value) || 1 })}
              />
            </Field>
            <Field label="Explanation (optional)">
              <Input
                value={question.explanation}
                onChange={(event) => update(index, { explanation: event.target.value })}
                placeholder="Shown to staff after grading"
              />
            </Field>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...questions, emptyQuizQuestion(questions.length)])}
      >
        Add MCQ
      </Button>
    </div>
  );
}
