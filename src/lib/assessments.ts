import type { AssessmentDelivery, AssessmentType } from '@/lib/types';

export interface AssessmentTypeConfig {
  value: AssessmentType;
  label: string;
  description: string;
  targetHint: string;
  requireCourse: boolean;
  requireDue: boolean;
  allowDeliveryChoice: boolean;
  defaultDelivery: AssessmentDelivery;
  studentOnlineMode: 'text_file' | 'file' | 'mcq' | 'none';
}

export const ASSESSMENT_TYPES: AssessmentTypeConfig[] = [
  {
    value: 'homework',
    label: 'Homework',
    description: 'Short take-home work. Track submitted or not submitted; this type does not take marks.',
    targetHint: 'Assign to a course, a batch, or both.',
    requireCourse: false,
    requireDue: true,
    allowDeliveryChoice: true,
    defaultDelivery: 'online',
    studentOnlineMode: 'text_file',
  },
  {
    value: 'class_test',
    label: 'Class test',
    description: 'Taken in class. Students do not submit online; you enter marks.',
    targetHint: 'Assign to the batch or course that will sit the test.',
    requireCourse: false,
    requireDue: true,
    allowDeliveryChoice: false,
    defaultDelivery: 'offline',
    studentOnlineMode: 'none',
  },
  {
    value: 'assignment',
    label: 'Assignment',
    description: 'Longer coursework. Choose online file submit or offline collection before you assign it.',
    targetHint: 'Assign to the course students should complete.',
    requireCourse: true,
    requireDue: true,
    allowDeliveryChoice: true,
    defaultDelivery: 'online',
    studentOnlineMode: 'file',
  },
  {
    value: 'exam',
    label: 'Exam',
    description: 'Formal exam. Conducted in person; marks appear after grading.',
    targetHint: 'Assign to a course or an exam batch.',
    requireCourse: false,
    requireDue: true,
    allowDeliveryChoice: false,
    defaultDelivery: 'offline',
    studentOnlineMode: 'none',
  },
  {
    value: 'quiz',
    label: 'Quiz',
    description: 'Traditional MCQ. Score comes from the student attempt. Set a timer; add remarks after.',
    targetHint: 'Assign to the course or batch the quiz belongs to.',
    requireCourse: false,
    requireDue: false,
    allowDeliveryChoice: true,
    defaultDelivery: 'online',
    studentOnlineMode: 'mcq',
  },
];

export const ASSESSMENT_TYPE_MAP = Object.fromEntries(
  ASSESSMENT_TYPES.map((item) => [item.value, item]),
) as Record<AssessmentType, AssessmentTypeConfig>;

export function assessmentTypeConfig(type: string | null | undefined): AssessmentTypeConfig {
  if (type && type in ASSESSMENT_TYPE_MAP) return ASSESSMENT_TYPE_MAP[type as AssessmentType];
  return ASSESSMENT_TYPE_MAP.homework;
}

export function resolveDelivery(
  type: string | null | undefined,
  delivery: string | null | undefined,
): AssessmentDelivery {
  const config = assessmentTypeConfig(type);
  if (!config.allowDeliveryChoice) return config.defaultDelivery;
  return delivery === 'offline' ? 'offline' : 'online';
}
