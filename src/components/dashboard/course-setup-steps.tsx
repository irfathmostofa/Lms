import Link from 'next/link';
import { cn } from '@/lib/utils';

const steps = [
  {
    key: 'basic',
    label: 'Basic setup',
    description: 'Title, description, access, media and pricing',
  },
  {
    key: 'curriculum',
    label: 'Curriculum',
    description: 'Topics with lessons, quizzes and assignments',
  },
  {
    key: 'additional',
    label: 'Additional',
    description: 'Optional outcomes, audience and requirements',
  },
] as const;

export type CourseSetupStep = (typeof steps)[number]['key'];

export function CourseSetupSteps({
  courseId,
  current,
  isNew = false,
}: {
  courseId?: string;
  current: CourseSetupStep;
  isNew?: boolean;
}) {
  return (
    <ol className="mb-6 grid gap-2 sm:grid-cols-3">
      {steps.map((step, index) => {
        const active = step.key === current;
        const available = !isNew || step.key === 'basic';
        const content = (
          <>
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                active
                  ? 'bg-brand-600 text-white'
                  : available
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-100 text-slate-400',
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-medium',
                  active ? 'text-brand-700' : available ? 'text-slate-700' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">{step.description}</span>
            </span>
          </>
        );

        const className = cn(
          'flex items-start gap-3 rounded-xl border px-4 py-3 transition',
          active
            ? 'border-brand-200 bg-brand-50'
            : available
              ? 'border-slate-200 bg-white hover:border-slate-300'
              : 'border-slate-200 bg-slate-50',
        );

        return (
          <li key={step.key}>
            {available && courseId ? (
              <Link href={`/dashboard/courses/${courseId}/setup?step=${step.key}`} className={className}>
                {content}
              </Link>
            ) : (
              <div className={className} aria-current={active ? 'step' : undefined}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
