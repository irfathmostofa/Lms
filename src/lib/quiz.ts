import type { QuizOptionKey, QuizQuestion } from '@/lib/types';

const OPTION_KEYS: QuizOptionKey[] = ['A', 'B', 'C', 'D', 'E'];

export function emptyQuizQuestion(sortOrder = 0): QuizQuestion {
  return {
    prompt: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_option: 'A',
    marks: 1,
    sort_order: sortOrder,
    explanation: '',
  };
}

export function parseQuizQuestions(raw: string | null | undefined): QuizQuestion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => normalizeQuizQuestion(item, index)).filter(Boolean) as QuizQuestion[];
  } catch {
    return [];
  }
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQuizQuestion(item: unknown, index: number): QuizQuestion | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const prompt = asText(row.prompt);
  const optionA = asText(row.option_a);
  const optionB = asText(row.option_b);
  if (!prompt || !optionA || !optionB) return null;
  const correct = String(row.correct_option ?? 'A').toUpperCase();
  return {
    id: asText(row.id) || undefined,
    prompt,
    option_a: optionA,
    option_b: optionB,
    option_c: asText(row.option_c),
    option_d: asText(row.option_d),
    option_e: asText(row.option_e),
    correct_option: OPTION_KEYS.includes(correct as QuizOptionKey) ? (correct as QuizOptionKey) : 'A',
    marks: Number(row.marks) > 0 ? Number(row.marks) : 1,
    sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
    explanation: asText(row.explanation),
  };
}

export function quizQuestionFromRow(row: {
  id?: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  correct_option: string;
  marks?: number | null;
  sort_order?: number | null;
  explanation?: string | null;
}, index = 0): QuizQuestion {
  const correct = String(row.correct_option ?? 'A').toUpperCase();
  return {
    id: row.id,
    prompt: row.prompt,
    option_a: row.option_a,
    option_b: row.option_b,
    option_c: row.option_c ?? '',
    option_d: row.option_d ?? '',
    option_e: row.option_e ?? '',
    correct_option: OPTION_KEYS.includes(correct as QuizOptionKey) ? (correct as QuizOptionKey) : 'A',
    marks: Number(row.marks) > 0 ? Number(row.marks) : 1,
    sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
    explanation: row.explanation ?? '',
  };
}

export function quizQuestionRows(questions: QuizQuestion[], assessmentId: string) {
  return questions.map((question, index) => ({
    assessment_id: assessmentId,
    prompt: question.prompt,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c || null,
    option_d: question.option_d || null,
    option_e: question.option_e || null,
    correct_option: question.correct_option,
    marks: question.marks,
    sort_order: index,
    explanation: question.explanation || null,
  }));
}

export function quizOptionEntries(question: {
  option_a: string;
  option_b: string;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
}) {
  return [
    { key: 'A' as const, text: question.option_a },
    { key: 'B' as const, text: question.option_b },
    { key: 'C' as const, text: question.option_c ?? '' },
    { key: 'D' as const, text: question.option_d ?? '' },
    { key: 'E' as const, text: question.option_e ?? '' },
  ].filter((option) => option.text.trim());
}

export function quizTotalMarks(questions: QuizQuestion[]) {
  return questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0);
}
