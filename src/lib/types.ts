export type UserRole = 'admin' | 'accountant' | 'instructor' | 'editor' | 'student';

export type CourseStatus = 'draft' | 'review' | 'published' | 'archived';
export type CourseMode = 'online' | 'offline' | 'hybrid';
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded' | 'cancelled';
export type PaymentGateway = 'manual' | 'sslcommerz';
export type LessonType = 'text' | 'image' | 'pdf' | 'youtube' | 'link';
export type AssessmentType = 'homework' | 'class_test' | 'assignment' | 'exam';
export type SubmissionStatus = 'submitted' | 'graded' | 'returned' | 'late' | 'missing';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type ProductType = 'digital' | 'physical';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Course {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  thumbnail_url: string | null;
  promo_video_id: string | null;
  mode: CourseMode;
  status: CourseStatus;
  level: string | null;
  language: string | null;
  price: number;
  discount_price: number | null;
  duration_hours: number | null;
  total_lessons: number;
  is_featured: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  batch_id: string | null;
  status: EnrollmentStatus;
  enrolled_by: string | null;
  enrolled_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface FeeRecord {
  id: string;
  enrollment_id: string;
  student_id: string;
  description: string | null;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
  installments: number;
  due_date: string | null;
  status: string;
}

export interface Payment {
  id: string;
  student_id: string;
  enrollment_id: string | null;
  order_id: string | null;
  purpose: string;
  gateway: PaymentGateway;
  method: string;
  amount: number;
  trx_id: string | null;
  sender_number: string | null;
  screenshot_url: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  type: LessonType;
  content: string | null;
  media_url: string | null;
  youtube_id: string | null;
  duration_min: number | null;
  sort_order: number;
  is_preview: boolean;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  is_free: boolean;
  lessons?: Lesson[];
}

export interface Batch {
  id: string;
  course_id: string;
  name: string;
  venue: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  instructor_id: string | null;
  is_active: boolean;
}

export interface Assessment {
  id: string;
  course_id: string | null;
  batch_id: string | null;
  title: string;
  instructions: string | null;
  type: AssessmentType;
  total_marks: number;
  pass_marks: number | null;
  due_at: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  stock: number;
  is_active: boolean;
}
