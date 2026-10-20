import type { AssessmentType } from '@/lib/types';

export interface AssessmentTypeConfig {
  value: AssessmentType;
  label: string;
  description: string;
  targetHint: string;
  requireCourse: boolean;
  requireDue: boolean;
  requireInstructions: boolean;
  studentMode: 'text' | 'text_file' | 'file' | 'quiz' | 'in_person';
}

export const ASSESSMENT_TYPES: AssessmentTypeConfig[] = [
  {
    value: 'homework',
    label: 'Homework',
    description: 'Take-home work with a written answer and optional attachment.',
    targetHint: 'Assign to a course, a batch, or both.',
    requireCourse: false,
    requireDue: true,
    requireInstructions: true,
    studentMode: 'text_file',
  },
  {
    value: 'class_test',
    label: 'Class test',
    description: 'Taken in class. Students do not submit online; you enter marks.',
    targetHint: 'Assign to the batch or course that will sit the test.',
    requireCourse: false,
    requireDue: true,
    requireInstructions: false,
    studentMode: 'in_person',
  },
  {
    value: 'assignment',
    label: 'Assignment',
    description: 'Longer coursework. Students upload a file and optional notes.',
    targetHint: 'Assign to the course students should submit against.',
    requireCourse: true,
    requireDue: true,
    requireInstructions: true,
    studentMode: 'file',
  },
  {
    value: 'exam',
    label: 'Exam',
    description: 'Formal exam. Conducted in person; marks appear after grading.',
    targetHint: 'Assign to a course or an exam batch.',
    requireCourse: false,
    requireDue: true,
    requireInstructions: false,
    studentMode: 'in_person',
  },
  {
    value: 'quiz',
    label: 'Quiz',
    description: 'Short questions answered online in a text box.',
    targetHint: 'Assign to the course the quiz belongs to.',
    requireCourse: true,
    requireDue: false,
    requireInstructions: true,
    studentMode: 'quiz',
  },
];

export const ASSESSMENT_TYPE_MAP = Object.fromEntries(
  ASSESSMENT_TYPES.map((item) => [item.value, item]),
) as Record<AssessmentType, AssessmentTypeConfig>;

export function assessmentTypeConfig(type: string | null | undefined): AssessmentTypeConfig {
  if (type && type in ASSESSMENT_TYPE_MAP) return ASSESSMENT_TYPE_MAP[type as AssessmentType];
  return ASSESSMENT_TYPE_MAP.homework;
}
