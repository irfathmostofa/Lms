-- ============================================================================
-- LMS Platform - Supabase schema
-- Run once in the Supabase SQL Editor.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role        as enum ('admin','accountant','instructor','editor','student');
create type public.course_status    as enum ('draft','review','published','archived');
create type public.course_mode      as enum ('online','offline','hybrid');
create type public.course_visibility as enum ('public','password','private');
create type public.enrollment_status as enum ('pending','active','completed','cancelled','expired');
create type public.payment_gateway  as enum ('manual','sslcommerz');
create type public.payment_status   as enum ('pending','verified','rejected','refunded','cancelled');
create type public.lesson_type      as enum ('text','image','pdf','youtube','link');
create type public.assessment_type  as enum ('homework','class_test','assignment','exam','quiz');
create type public.submission_status as enum ('submitted','graded','returned','late','missing');
create type public.attendance_status as enum ('present','absent','late','excused');
create type public.product_type     as enum ('digital','physical');
create type public.order_status     as enum ('pending','paid','processing','shipped','delivered','cancelled','refunded');
create type public.order_source     as enum ('online','manual');
create type public.session_status   as enum ('scheduled','completed','cancelled');

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        public.user_role not null default 'student',
  avatar_url  text,
  bio         text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index categories_parent_idx on public.categories(parent_id);

create table public.courses (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references public.categories(id) on delete set null,
  title            text not null,
  slug             text not null unique,
  summary          text,
  description      text,
  thumbnail_url    text,
  promo_video_id   text,
  mode             public.course_mode not null default 'online',
  status           public.course_status not null default 'draft',
  visibility       public.course_visibility not null default 'public',
  scheduled_at     timestamptz,
  author_id        uuid references public.profiles(id) on delete set null,
  author_name      text,
  tags             text[] not null default '{}',
  level            text,
  language         text default 'bn',
  price            numeric(12,2) not null default 0,
  discount_price   numeric(12,2),
  duration_hours   int,
  duration_label   text,
  learning_outcomes text,
  target_audience  text,
  materials_included text,
  requirements     text,
  total_lessons    int not null default 0,
  is_featured      boolean not null default false,
  published_at     timestamptz,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index courses_category_idx on public.courses(category_id);
create index courses_status_idx   on public.courses(status);
create index courses_author_idx   on public.courses(author_id);
create index courses_visibility_idx on public.courses(visibility);
create index courses_tags_idx     on public.courses using gin(tags);
create index courses_published_idx on public.courses(published_at desc) where status = 'published';

-- Password-protected courses: hashes live in a separate table so the anon API
-- can never read them through the public course projection.
create table public.course_access (
  course_id     uuid primary key references public.courses(id) on delete cascade,
  password_hash text not null,
  updated_at    timestamptz not null default now()
);

create table public.course_instructors (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  is_lead       boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (course_id, instructor_id)
);
create index course_instructors_course_idx     on public.course_instructors(course_id);
create index course_instructors_instructor_idx on public.course_instructors(instructor_id);

create table public.instructor_shares (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  share_percent numeric(5,2) not null default 0 check (share_percent between 0 and 100),
  created_at    timestamptz not null default now(),
  unique (course_id, instructor_id)
);

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------
create table public.course_sections (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  summary    text,
  sort_order int not null default 0,
  is_free    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index course_sections_course_idx on public.course_sections(course_id);

create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references public.course_sections(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  type         public.lesson_type not null default 'text',
  content      text,
  media_url    text,
  youtube_id   text,
  duration_min int,
  sort_order   int not null default 0,
  is_preview   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index lessons_section_idx on public.lessons(section_id);
create index lessons_course_idx  on public.lessons(course_id);

create table public.course_outline_items (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index course_outline_items_course_idx on public.course_outline_items(course_id);

-- ---------------------------------------------------------------------------
-- Offline
-- ---------------------------------------------------------------------------
create table public.batches (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  name        text not null,
  venue       text,
  schedule    text,
  start_date  date,
  end_date    date,
  capacity    int,
  instructor_id uuid references public.profiles(id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index batches_course_idx     on public.batches(course_id);
create index batches_instructor_idx on public.batches(instructor_id);

create table public.class_sessions (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.batches(id) on delete cascade,
  title         text,
  session_date  date not null,
  start_time    time,
  end_time      time,
  venue         text,
  status        public.session_status not null default 'scheduled',
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index class_sessions_batch_idx on public.class_sessions(batch_id);
create index class_sessions_date_idx  on public.class_sessions(session_date);

create table public.attendance (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status     public.attendance_status not null default 'absent',
  remarks    text,
  marked_by  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index attendance_session_idx on public.attendance(session_id);
create index attendance_student_idx on public.attendance(student_id);

-- ---------------------------------------------------------------------------
-- Enrollment
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  batch_id    uuid references public.batches(id) on delete set null,
  status      public.enrollment_status not null default 'pending',
  enrolled_by uuid references public.profiles(id) on delete set null,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  notes       text,
  updated_at  timestamptz not null default now(),
  unique (student_id, course_id)
);
create index enrollments_student_idx on public.enrollments(student_id);
create index enrollments_course_idx  on public.enrollments(course_id);
create index enrollments_batch_idx   on public.enrollments(batch_id);
create index enrollments_status_idx  on public.enrollments(status);

create table public.fee_records (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null references public.enrollments(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  description    text,
  total_amount   numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  net_amount     numeric(12,2) generated always as (total_amount - discount_amount) stored,
  paid_amount    numeric(12,2) not null default 0,
  due_amount     numeric(12,2) generated always as (total_amount - discount_amount - paid_amount) stored,
  installments   int not null default 1,
  due_date       date,
  status         text not null default 'unpaid',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index fee_records_enrollment_idx on public.fee_records(enrollment_id);
create index fee_records_student_idx    on public.fee_records(student_id);

-- ---------------------------------------------------------------------------
-- Store
-- ---------------------------------------------------------------------------
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  type          public.product_type not null default 'digital',
  description   text,
  thumbnail_url text,
  price         numeric(12,2) not null default 0,
  stock         int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_type_idx on public.products(type);

create table public.product_files (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title      text not null,
  file_url   text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_files_product_idx on public.product_files(product_id);

create table public.orders (
  id          uuid primary key default gen_random_uuid(),
  order_no    text not null unique,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      public.order_status not null default 'pending',
  source      public.order_source not null default 'online',
  subtotal    numeric(12,2) not null default 0,
  shipping    numeric(12,2) not null default 0,
  total       numeric(12,2) not null default 0,
  shipping_name    text,
  shipping_phone   text,
  shipping_address text,
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index orders_user_idx   on public.orders(user_id);
create index orders_status_idx on public.orders(status);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  unit_price  numeric(12,2) not null default 0,
  quantity    int not null default 1 check (quantity > 0),
  line_total  numeric(12,2) not null default 0
);
create index order_items_order_idx   on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles(id) on delete cascade,
  enrollment_id  uuid references public.enrollments(id) on delete set null,
  order_id       uuid references public.orders(id) on delete set null,
  purpose        text not null default 'course',
  gateway        public.payment_gateway not null default 'manual',
  method         text not null,
  amount         numeric(12,2) not null check (amount > 0),
  trx_id         text,
  sender_number  text,
  screenshot_url text,
  status         public.payment_status not null default 'pending',
  paid_at        timestamptz,
  verified_by    uuid references public.profiles(id) on delete set null,
  verified_at    timestamptz,
  notes          text,
  raw            jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index payments_student_idx    on public.payments(student_id);
create index payments_enrollment_idx on public.payments(enrollment_id);
create index payments_order_idx      on public.payments(order_id);
create index payments_status_idx     on public.payments(status);
create unique index payments_trx_unique on public.payments(lower(trx_id)) where trx_id is not null;

create table public.product_access (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  order_id   uuid references public.orders(id) on delete set null,
  source     text not null default 'purchase',
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (product_id, user_id)
);
create index product_access_user_idx    on public.product_access(user_id);
create index product_access_product_idx on public.product_access(product_id);

-- ---------------------------------------------------------------------------
-- Learning
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  student_id   uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  is_completed boolean not null default false,
  seconds_watched int not null default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (lesson_id, student_id)
);
create index lesson_progress_student_idx on public.lesson_progress(student_id);
create index lesson_progress_course_idx  on public.lesson_progress(course_id);

create table public.assessments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references public.courses(id) on delete cascade,
  batch_id    uuid references public.batches(id) on delete cascade,
  section_id  uuid references public.course_sections(id) on delete cascade,
  title       text not null,
  instructions text,
  type        public.assessment_type not null default 'homework',
  total_marks numeric(6,2) not null default 100,
  pass_marks  numeric(6,2),
  due_at      timestamptz,
  is_published boolean not null default false,
  sort_order  int not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (course_id is not null or batch_id is not null)
);
create index assessments_course_idx on public.assessments(course_id);
create index assessments_batch_idx  on public.assessments(batch_id);
create index assessments_section_idx on public.assessments(section_id);

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  content       text,
  file_url      text,
  status        public.submission_status not null default 'submitted',
  marks         numeric(6,2),
  feedback      text,
  submitted_at  timestamptz not null default now(),
  graded_at     timestamptz,
  graded_by     uuid references public.profiles(id) on delete set null,
  unique (assessment_id, student_id)
);
create index submissions_assessment_idx on public.submissions(assessment_id);
create index submissions_student_idx    on public.submissions(student_id);

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------
create table public.finance_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  kind       text not null check (kind in ('income','expense')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.finance_categories(id) on delete set null,
  course_id     uuid references public.courses(id) on delete set null,
  title         text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  expense_date  date not null default current_date,
  paid_to       text,
  method        text,
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index expenses_date_idx     on public.expenses(expense_date);
create index expenses_category_idx on public.expenses(category_id);
create index expenses_course_idx   on public.expenses(course_id);

create table public.manual_incomes (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.finance_categories(id) on delete set null,
  course_id     uuid references public.courses(id) on delete set null,
  title         text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  income_date   date not null default current_date,
  source        text,
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index manual_incomes_date_idx     on public.manual_incomes(income_date);
create index manual_incomes_category_idx on public.manual_incomes(category_id);

-- ---------------------------------------------------------------------------
-- Config
-- ---------------------------------------------------------------------------
create table public.lookups (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  code       text not null,
  label      text not null,
  label_bn   text,
  value      jsonb,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  unique (type, code)
);
create index lookups_type_idx on public.lookups(type);

create table public.settings (
  id          uuid primary key default gen_random_uuid(),
  group_name  text not null,
  key         text not null unique,
  value       text,
  value_type  text not null default 'text' check (value_type in ('text','number','boolean','json')),
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now()
);
create index settings_group_idx on public.settings(group_name);

-- ---------------------------------------------------------------------------
-- System
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles(id) on delete set null,
  table_name text not null,
  action     text not null,
  row_id     uuid,
  changes    jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_table_idx on public.audit_logs(table_name);
create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, is_read);

-- ============================================================================
-- Helper functions (stable, security definer where they bypass RLS)
-- ============================================================================
create or replace function public.current_role_name()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'student'::public.user_role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select (select public.current_role_name()) = 'admin';
$$;

create or replace function public.is_accountant()
returns boolean language sql stable as $$
  select (select public.current_role_name()) in ('admin','accountant');
$$;

create or replace function public.is_instructor()
returns boolean language sql stable as $$
  select (select public.current_role_name()) in ('admin','instructor');
$$;

create or replace function public.is_editor()
returns boolean language sql stable as $$
  select (select public.current_role_name()) in ('admin','editor');
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select (select public.current_role_name()) in ('admin','accountant','instructor','editor');
$$;

create or replace function public.is_instructor_of(p_course uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.course_instructors ci
    where ci.course_id = p_course and ci.instructor_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled(p_course uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course and e.student_id = auth.uid() and e.status = 'active'
  );
$$;

create or replace function public.is_course_published(p_course uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course and c.status = 'published' and c.visibility <> 'private'
  );
$$;

-- Password-protected course access. Only this definer function can read the
-- hash; anon never gets a select grant on public.course_access.
create or replace function public.set_course_password(p_course uuid, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_editor() then
    raise exception 'Not allowed';
  end if;

  if p_password is null or length(trim(p_password)) = 0 then
    delete from public.course_access where course_id = p_course;
  else
    insert into public.course_access (course_id, password_hash)
    values (p_course, crypt(p_password, gen_salt('bf')))
    on conflict (course_id) do update
      set password_hash = excluded.password_hash, updated_at = now();
  end if;
end $$;

create or replace function public.verify_course_password(p_course uuid, p_password text)
returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.course_access
    where course_id = p_course
      and password_hash = crypt(p_password, password_hash)
  );
$$;

create or replace function public.can_access_course(p_course uuid)
returns boolean language sql stable as $$
  select (select public.is_staff())
      or (select public.is_instructor_of(p_course))
      or (select public.is_enrolled(p_course));
$$;

create or replace function public.has_product_access(p_product uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.product_access pa
    where pa.product_id = p_product and pa.user_id = auth.uid()
      and (pa.expires_at is null or pa.expires_at > now())
  );
$$;

create or replace function public.setting_num(p_key text, p_default numeric default 0)
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select nullif(value,'')::numeric from public.settings where key = p_key),
    p_default
  );
$$;

create or replace function public.get_lookups(p_type text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(
           jsonb_build_object('code', code, 'label', label, 'label_bn', label_bn, 'value', value)
           order by sort_order, label
         ), '[]'::jsonb)
  from public.lookups
  where type = p_type and is_active = true;
$$;

create or replace function public.get_public_settings()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from public.settings where is_public = true;
$$;

create or replace function public.get_home_stats()
returns table (courses bigint, lessons bigint, students bigint, resources bigint, categories bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.courses
      where status = 'published' and visibility <> 'private'),
    (select count(*) from public.lessons l
      join public.courses c on c.id = l.course_id
      where c.status = 'published' and c.visibility <> 'private'),
    (select count(*) from public.profiles where role = 'student' and is_active),
    (select count(*) from public.products where is_active),
    (select count(*) from public.categories where is_active);
$$;

grant execute on function public.get_home_stats() to anon, authenticated;

-- Category tree helpers -----------------------------------------------------
create or replace function public.category_subtree_ids(p_root uuid)
returns setof uuid
language sql stable as $$
  with recursive tree as (
    select id from public.categories where id = p_root
    union all
    select c.id from public.categories c join tree t on c.parent_id = t.id
  )
  select id from tree;
$$;

create or replace function public.category_breadcrumb(p_category uuid)
returns text[]
language sql stable as $$
  with recursive up as (
    select id, name, parent_id, 1 as depth from public.categories where id = p_category
    union all
    select c.id, c.name, c.parent_id, up.depth + 1
    from public.categories c join up on c.id = up.parent_id
  )
  select array_agg(name order by depth desc) from up;
$$;

create or replace function public.category_depth(p_category uuid)
returns int
language sql stable as $$
  with recursive up as (
    select id, parent_id, 1 as depth from public.categories where id = p_category
    union all
    select c.id, c.parent_id, up.depth + 1
    from public.categories c join up on c.id = up.parent_id
  )
  select coalesce(max(depth), 0) from up;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'student'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Only block role changes from an authenticated client that is not an admin.
  -- A null auth context (service role, SQL editor, Edge Function) is trusted.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not (select public.is_admin()) then
    new.role := old.role;
  end if;
  return new;
end $$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

create or replace function public.enforce_publish_admin()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and old.status is distinct from 'published'
     and auth.uid() is not null
     and not (select public.is_admin()) then
    raise exception 'Only an admin can publish a course';
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger courses_guard_publish
  before update on public.courses
  for each row execute function public.enforce_publish_admin();

create or replace function public.sync_course_lesson_count()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_course uuid;
begin
  if tg_op = 'UPDATE' and old.course_id is distinct from new.course_id then
    update public.courses c
      set total_lessons = (select count(*) from public.lessons l where l.course_id = old.course_id)
      where c.id = old.course_id;
  end if;

  v_course := coalesce(new.course_id, old.course_id);
  update public.courses c
    set total_lessons = (select count(*) from public.lessons l where l.course_id = v_course)
    where c.id = v_course;

  return coalesce(new, old);
end $$;

create trigger lessons_sync_count
  after insert or update of course_id or delete on public.lessons
  for each row execute function public.sync_course_lesson_count();

create or replace function public.audit_log_trigger()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_row jsonb;
  v_id uuid;
begin
  if tg_op = 'INSERT' then v_action := 'insert'; v_row := to_jsonb(new); v_id := new.id;
  elsif tg_op = 'UPDATE' then v_action := 'update'; v_row := to_jsonb(new); v_id := new.id;
  else v_action := 'delete'; v_row := to_jsonb(old); v_id := old.id;
  end if;
  insert into public.audit_logs (actor_id, table_name, action, row_id, changes)
  values (auth.uid(), tg_table_name, v_action, v_id, v_row);
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

create or replace function public.on_payment_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_net numeric(12,2);
  v_paid numeric(12,2);
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    new.verified_at := coalesce(new.verified_at, now());
    new.paid_at := coalesce(new.paid_at, now());

    if new.enrollment_id is not null then
      update public.fee_records fr
        set paid_amount = fr.paid_amount + new.amount,
            status = case
                       when fr.total_amount - fr.discount_amount - (fr.paid_amount + new.amount) <= 0 then 'paid'
                       when fr.paid_amount + new.amount > 0 then 'partial'
                       else 'unpaid'
                     end,
            updated_at = now()
      where fr.enrollment_id = new.enrollment_id;

      select coalesce(sum(total_amount - discount_amount), 0), coalesce(sum(paid_amount), 0)
        into v_net, v_paid
      from public.fee_records where enrollment_id = new.enrollment_id;

      if v_paid >= v_net then
        update public.enrollments
          set status = 'active', updated_at = now()
        where id = new.enrollment_id and status = 'pending';
      end if;
    end if;

    if new.order_id is not null then
      update public.orders
        set status = case when status = 'pending' then 'paid' else status end,
            updated_at = now()
      where id = new.order_id;

      insert into public.product_access (product_id, user_id, order_id, source)
      select oi.product_id, new.student_id, new.order_id, 'purchase'
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = new.order_id and p.type = 'digital'
      on conflict (product_id, user_id) do nothing;

      update public.products p
        set stock = greatest(p.stock - oi.quantity, 0)
      from public.order_items oi
      where oi.order_id = new.order_id and oi.product_id = p.id and p.type = 'physical';
    end if;
  end if;
  return new;
end $$;

create trigger payments_on_change
  before update on public.payments
  for each row execute function public.on_payment_change();

create or replace function public.orders_set_totals()
returns trigger language plpgsql as $$
begin
  new.subtotal := coalesce((
    select sum(line_total) from public.order_items where order_id = new.id
  ), new.subtotal);
  new.total := new.subtotal + coalesce(new.shipping, 0);
  return new;
end $$;

-- ============================================================================
-- Index maintenance triggers for updated_at
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','courses','course_sections','lessons','batches',
    'attendance','enrollments','fee_records','products','orders','payments',
    'assessments','lesson_progress'
  ] loop
    execute format(
      'create trigger %1$s_touch before update on public.%1$s
         for each row execute function public.touch_updated_at();',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- Views & report functions
-- ============================================================================
create or replace view public.public_category_tree as
with recursive base as (
  select c.id, c.parent_id, c.name, c.slug, 1 as depth
  from public.categories c where c.parent_id is null and c.is_active
  union all
  select c.id, c.parent_id, c.name, c.slug, b.depth + 1
  from public.categories c join base b on c.parent_id = b.id
  where c.is_active
)
select
  b.id, b.parent_id, b.name, b.slug, b.depth,
  (select count(*) from public.courses co
     where co.status = 'published'
       and co.category_id in (select public.category_subtree_ids(b.id))) as course_count
from base b;

-- Deliberate public projection: safe outline columns only, published courses only.
-- Owned by the schema owner (definer) so unenrolled visitors can read titles.
create or replace view public.public_lesson_outline as
select
  l.id, l.section_id, l.course_id, l.title, l.type, l.duration_min,
  l.sort_order, l.is_preview
from public.lessons l
join public.courses c on c.id = l.course_id
where c.status = 'published' and c.visibility <> 'private';

-- Student-facing views MUST be security_invoker so RLS on the base tables
-- applies to the querying user. Without this, a student could read other
-- students' aggregated rows through the view.
create or replace view public.vw_student_attendance
  with (security_invoker = true) as
select
  a.student_id,
  cs.batch_id,
  count(*) filter (where a.status = 'present') as present_count,
  count(*) filter (where a.status = 'absent')  as absent_count,
  count(*) filter (where a.status = 'late')    as late_count,
  count(*) as total_count,
  round(100.0 * count(*) filter (where a.status in ('present','late')) / nullif(count(*),0), 1) as attendance_pct
from public.attendance a
join public.class_sessions cs on cs.id = a.session_id
group by a.student_id, cs.batch_id;

create or replace view public.vw_student_performance
  with (security_invoker = true) as
select
  s.student_id,
  a.course_id,
  count(*) as graded_count,
  round(avg(s.marks), 2) as avg_marks,
  round(sum(s.marks), 2) as total_marks
from public.submissions s
join public.assessments a on a.id = s.assessment_id
where s.status = 'graded'
group by s.student_id, a.course_id;

create or replace view public.vw_course_progress
  with (security_invoker = true) as
select
  e.student_id,
  e.course_id,
  count(distinct l.id) as total_lessons,
  count(distinct lp.lesson_id) filter (where lp.is_completed) as completed_lessons,
  round(100.0 * count(distinct lp.lesson_id) filter (where lp.is_completed)
        / nullif(count(distinct l.id), 0), 1) as progress_pct
from public.enrollments e
left join public.lessons l on l.course_id = e.course_id
left join public.lesson_progress lp on lp.lesson_id = l.id and lp.student_id = e.student_id
group by e.student_id, e.course_id;

create or replace function public.finance_monthly_pnl(p_from date default date_trunc('month', current_date - interval '11 months')::date,
                                                     p_to   date default current_date)
returns table (month date, income numeric, expense numeric, profit numeric)
language sql stable security definer set search_path = public as $$
  with months as (
    select generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date as month
  ),
  income as (
    select date_trunc('month', coalesce(paid_at, created_at))::date as month, sum(amount) as total
    from public.payments where status = 'verified' group by 1
    union all
    select date_trunc('month', income_date)::date, sum(amount)
    from public.manual_incomes group by 1
  ),
  expense as (
    select date_trunc('month', expense_date)::date as month, sum(amount) as total
    from public.expenses group by 1
  )
  select m.month,
         coalesce((select sum(total) from income i where i.month = m.month), 0) as income,
         coalesce((select sum(total) from expense e where e.month = m.month), 0) as expense,
         coalesce((select sum(total) from income i where i.month = m.month), 0)
           - coalesce((select sum(total) from expense e where e.month = m.month), 0) as profit
  from months m order by m.month;
$$;

create or replace function public.course_profitability(p_course uuid)
returns table (course_id uuid, income numeric, expense numeric, profit numeric)
language sql stable security definer set search_path = public as $$
  select p_course,
    coalesce((select sum(p.amount) from public.payments p
              join public.enrollments e on e.id = p.enrollment_id
              where p.status = 'verified' and e.course_id = p_course), 0)
    + coalesce((select sum(mi.amount) from public.manual_incomes mi where mi.course_id = p_course), 0),
    coalesce((select sum(x.amount) from public.expenses x where x.course_id = p_course), 0),
    coalesce((select sum(p.amount) from public.payments p
              join public.enrollments e on e.id = p.enrollment_id
              where p.status = 'verified' and e.course_id = p_course), 0)
    + coalesce((select sum(mi.amount) from public.manual_incomes mi where mi.course_id = p_course), 0)
    - coalesce((select sum(x.amount) from public.expenses x where x.course_id = p_course), 0);
$$;

create or replace function public.place_order(p_items jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_item jsonb;
  v_product public.products;
  v_qty int;
  v_has_physical boolean := false;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Empty order'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid and is_active;
    if not found then raise exception 'Product not available'; end if;
    if v_product.type = 'physical' then
      v_has_physical := true;
      if v_product.stock < v_qty then
        raise exception 'Insufficient stock for %', v_product.name;
      end if;
    end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  if v_has_physical then
    v_shipping := public.setting_num('shipping_flat', 0);
    if v_subtotal >= public.setting_num('free_shipping_min', 0) then
      v_shipping := 0;
    end if;
  end if;

  insert into public.orders (order_no, user_id, status, source, subtotal, shipping, total)
  values ('ORD-' || to_char(now(), 'YYMMDDHH24MISSMS'), v_user, 'pending', 'online',
          v_subtotal, v_shipping, v_subtotal + v_shipping)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);
  end loop;

  return v_order;
end $$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','courses','course_access','course_instructors','instructor_shares',
    'course_sections','lessons','course_outline_items','batches','class_sessions',
    'attendance','enrollments','fee_records','products','product_files','orders',
    'order_items','payments','product_access','lesson_progress','assessments',
    'submissions','finance_categories','expenses','manual_incomes','lookups',
    'settings','audit_logs','notifications'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- profiles ------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select using (id = (select auth.uid()));
create policy profiles_select_staff on public.profiles
  for select using ((select public.is_staff()));
create policy profiles_update_self on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_admin_all on public.profiles
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- categories ----------------------------------------------------------------
create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- courses -------------------------------------------------------------------
create policy courses_select_published on public.courses
  for select using (
    (status = 'published' and visibility <> 'private')
    or (select public.is_editor())
    or (select public.is_instructor_of(id))
    or (select public.is_enrolled(id))
  );
create policy courses_insert_editor on public.courses
  for insert with check ((select public.is_editor()));
create policy courses_update_editor on public.courses
  for update using ((select public.is_editor())) with check ((select public.is_editor()));
create policy courses_admin_delete on public.courses
  for delete using ((select public.is_admin()));

-- course_access -------------------------------------------------------------
create policy course_access_editor on public.course_access
  for all using ((select public.is_editor())) with check ((select public.is_editor()));

-- course_instructors --------------------------------------------------------
create policy course_instructors_read on public.course_instructors
  for select using (true);
create policy course_instructors_admin on public.course_instructors
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy instructor_shares_read on public.instructor_shares
  for select using ((select public.is_admin()) or instructor_id = (select auth.uid()));
create policy instructor_shares_admin on public.instructor_shares
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- curriculum ----------------------------------------------------------------
create policy sections_read on public.course_sections
  for select using (
    (select public.is_course_published(course_id))
    or (select public.is_staff())
    or (select public.is_instructor_of(course_id))
    or (select public.is_enrolled(course_id))
  );
create policy sections_write on public.course_sections
  for all using ((select public.is_editor()) or (select public.is_instructor_of(course_id)))
  with check ((select public.is_editor()) or (select public.is_instructor_of(course_id)));

create policy lessons_read on public.lessons
  for select using (
    is_preview or (select public.can_access_course(course_id))
  );
create policy lessons_write on public.lessons
  for all using ((select public.is_editor()) or (select public.is_instructor_of(course_id)))
  with check ((select public.is_editor()) or (select public.is_instructor_of(course_id)));

create policy outline_read on public.course_outline_items
  for select using (
    (select public.is_course_published(course_id))
    or (select public.is_staff())
    or (select public.is_instructor_of(course_id))
  );
create policy outline_write on public.course_outline_items
  for all using ((select public.is_editor()) or (select public.is_instructor_of(course_id)))
  with check ((select public.is_editor()) or (select public.is_instructor_of(course_id)));

-- offline -------------------------------------------------------------------
create policy batches_read on public.batches
  for select using (
    (select public.is_staff())
    or exists (select 1 from public.enrollments e
               where e.batch_id = batches.id and e.student_id = (select auth.uid()))
  );
create policy batches_write on public.batches
  for all using ((select public.is_admin()) or (select public.is_instructor_of(course_id)))
  with check ((select public.is_admin()) or (select public.is_instructor_of(course_id)));

create policy sessions_read on public.class_sessions
  for select using (
    (select public.is_staff())
    or exists (select 1 from public.batches b join public.enrollments e on e.batch_id = b.id
               where b.id = class_sessions.batch_id and e.student_id = (select auth.uid()))
  );
create policy sessions_write on public.class_sessions
  for all using (
    (select public.is_admin()) or (select public.is_instructor()) or (select public.is_editor())
  ) with check (
    (select public.is_admin()) or (select public.is_instructor()) or (select public.is_editor())
  );

create policy attendance_read on public.attendance
  for select using ((select public.is_staff()) or student_id = (select auth.uid()));
create policy attendance_write on public.attendance
  for all using ((select public.is_admin()) or (select public.is_instructor()))
  with check ((select public.is_admin()) or (select public.is_instructor()));

-- enrollment ----------------------------------------------------------------
create policy enrollments_read on public.enrollments
  for select using (student_id = (select auth.uid()) or (select public.is_staff()));
create policy enrollments_admin on public.enrollments
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy fee_records_read on public.fee_records
  for select using (student_id = (select auth.uid()) or (select public.is_accountant()));
create policy fee_records_write on public.fee_records
  for all using ((select public.is_accountant())) with check ((select public.is_accountant()));

-- store ---------------------------------------------------------------------
create policy products_read on public.products for select using (is_active or (select public.is_staff()));
create policy products_admin on public.products
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy product_files_read on public.product_files
  for select using (
    (select public.is_staff())
    or (select public.has_product_access(product_id))
  );
create policy product_files_admin on public.product_files
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy orders_read on public.orders
  for select using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy orders_write on public.orders
  for insert with check (user_id = (select auth.uid()) or (select public.is_staff()));
create policy orders_admin on public.orders
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy order_items_read on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.user_id = (select auth.uid()) or (select public.is_staff())))
  );
create policy order_items_admin on public.order_items
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- payments ------------------------------------------------------------------
create policy payments_read on public.payments
  for select using (student_id = (select auth.uid()) or (select public.is_accountant()));
create policy payments_insert_own on public.payments
  for insert with check (student_id = (select auth.uid()) and status = 'pending');
create policy payments_staff_all on public.payments
  for all using ((select public.is_accountant())) with check ((select public.is_accountant()));

create policy product_access_read on public.product_access
  for select using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy product_access_admin on public.product_access
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- learning ------------------------------------------------------------------
create policy lesson_progress_read on public.lesson_progress
  for select using (student_id = (select auth.uid()) or (select public.is_staff()));
create policy lesson_progress_write on public.lesson_progress
  for all using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

create policy assessments_read on public.assessments
  for select using (
    (select public.is_staff())
    or (is_published and (
         (course_id is not null and (select public.is_enrolled(course_id)))
      or (batch_id is not null and exists (
            select 1 from public.enrollments e
            where e.batch_id = assessments.batch_id and e.student_id = (select auth.uid())))))
  );
create policy assessments_write on public.assessments
  for all using (
    (select public.is_editor())
    or (select public.is_instructor())
  ) with check (
    (select public.is_editor())
    or (select public.is_instructor())
  );

create policy submissions_read on public.submissions
  for select using (
    student_id = (select auth.uid()) or (select public.is_staff())
  );
create policy submissions_insert_own on public.submissions
  for insert with check (student_id = (select auth.uid()));
create policy submissions_write_staff on public.submissions
  for all using ((select public.is_instructor())) with check ((select public.is_instructor()));

-- finance -------------------------------------------------------------------
create policy finance_categories_read on public.finance_categories
  for select using ((select public.is_accountant()));
create policy finance_categories_write on public.finance_categories
  for all using ((select public.is_accountant())) with check ((select public.is_accountant()));

create policy expenses_all on public.expenses
  for all using ((select public.is_accountant())) with check ((select public.is_accountant()));
create policy manual_incomes_all on public.manual_incomes
  for all using ((select public.is_accountant())) with check ((select public.is_accountant()));

-- config --------------------------------------------------------------------
create policy lookups_read on public.lookups for select using (true);
create policy lookups_admin on public.lookups
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy settings_read on public.settings for select using (is_public or (select public.is_staff()));
create policy settings_admin on public.settings
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- system --------------------------------------------------------------------
create policy audit_logs_read on public.audit_logs
  for select using ((select public.is_admin()));

create policy notifications_read on public.notifications
  for select using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_admin on public.notifications
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- money auditing ------------------------------------------------------------
create trigger payments_audit
  after insert or update or delete on public.payments
  for each row execute function public.audit_log_trigger();

create trigger fee_records_audit
  after update on public.fee_records
  for each row execute function public.audit_log_trigger();

-- ============================================================================
-- Grants
-- RLS is the real gate; these grants are the minimum needed for the API roles
-- to reach the tables at all. Revoke everything from anon by default is the
-- Supabase convention, so we grant explicitly per role.
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

-- Anonymous visitors can read only the public catalog surface.
grant select on public.categories,
                public.courses,
                public.course_sections,
                public.public_lesson_outline,
                public.products,
                public.lookups,
                public.settings
  to anon;
grant execute on function public.get_lookups(text),
                        public.get_public_settings(),
                        public.category_subtree_ids(uuid),
                        public.category_breadcrumb(uuid),
                        public.verify_course_password(uuid, text)
  to anon;

-- ============================================================================
-- Seed data
-- ============================================================================
insert into public.lookups (type, code, label, label_bn, sort_order) values
  ('payment_method','bkash','bKash','বিকাশ',1),
  ('payment_method','nagad','Nagad','নগদ',2),
  ('payment_method','rocket','Rocket','রকেট',3),
  ('payment_method','upay','Upay','উপায়',4),
  ('payment_method','bank','Bank Transfer','ব্যাংক',5),
  ('payment_method','cash','Cash','ক্যাশ',6),
  ('enrollment_status','pending','Pending','অপেক্ষমাণ',1),
  ('enrollment_status','active','Active','সক্রিয়',2),
  ('enrollment_status','completed','Completed','সম্পন্ন',3),
  ('order_status','pending','Pending','অপেক্ষমাণ',1),
  ('order_status','paid','Paid','পরিশোধিত',2),
  ('order_status','shipped','Shipped','প্রেরিত',3),
  ('order_status','delivered','Delivered','বিতরণ',4),
  ('course_level','beginner','Beginner','শিক্ষানবিস',1),
  ('course_level','intermediate','Intermediate','মাধ্যমিক',2),
  ('course_level','advanced','Advanced','উন্নত',3)
on conflict (type, code) do nothing;

insert into public.lookups (type, code, label, value, sort_order) values
  ('payment_method_config','bkash','bKash','{"number":"01700000000","type":"personal"}'::jsonb,1),
  ('payment_method_config','nagad','Nagad','{"number":"01700000000","type":"personal"}'::jsonb,2),
  ('payment_method_config','rocket','Rocket','{"number":"01700000000","type":"personal"}'::jsonb,3),
  ('payment_method_config','upay','Upay','{"number":"01700000000","type":"personal"}'::jsonb,4)
on conflict (type, code) do nothing;

insert into public.settings (group_name, key, value, value_type, is_public) values
  ('general','site_name','LMS Platform','text',true),
  ('general','support_phone','+8801700000000','text',true),
  ('general','support_email','support@example.com','text',true),
  ('general','currency','BDT','text',true),
  ('payment','manual_enabled','true','boolean',true),
  ('payment','sslcommerz_enabled','false','boolean',true),
  ('payment','payment_instructions','Send money to the number below, then submit the transaction ID for verification.','text',true),
  ('academic','attendance_pass_percent','75','number',true),
  ('academic','default_pass_marks','40','number',false),
  ('store','shipping_flat','60','number',true),
  ('store','free_shipping_min','1500','number',true)
on conflict (key) do nothing;

insert into public.finance_categories (name, kind) values
  ('Course Fee','income'),
  ('Store Sales','income'),
  ('Other Income','income'),
  ('Instructor Payment','expense'),
  ('Marketing','expense'),
  ('Rent','expense'),
  ('Utilities','expense'),
  ('Salary','expense'),
  ('Other Expense','expense');

insert into public.categories (name, slug, sort_order) values
  ('Academic','academic',1),
  ('Admission','admission',2),
  ('Skills','skills',3),
  ('Language','language',4)
on conflict (slug) do nothing;

insert into public.categories (parent_id, name, slug, sort_order)
select (select id from public.categories where slug='academic'), 'HSC', 'hsc', 1
on conflict (slug) do nothing;
insert into public.categories (parent_id, name, slug, sort_order)
select (select id from public.categories where slug='academic'), 'SSC', 'ssc', 2
on conflict (slug) do nothing;
insert into public.categories (parent_id, name, slug, sort_order)
select (select id from public.categories where slug='hsc'), 'Science', 'hsc-science', 1
on conflict (slug) do nothing;
insert into public.categories (parent_id, name, slug, sort_order)
select (select id from public.categories where slug='hsc'), 'Commerce', 'hsc-commerce', 2
on conflict (slug) do nothing;

insert into public.categories (parent_id, name, slug, sort_order)
select (select id from public.categories where slug='skills'), 'Programming', 'programming', 1
on conflict (slug) do nothing;
insert into public.categories (parent_id, name, slug, sort_order)
select (select id from public.categories where slug='programming'), 'Web Development', 'web-development', 1
on conflict (slug) do nothing;

-- ============================================================================
-- Promote the first admin after signing up:
--   update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
-- ============================================================================
