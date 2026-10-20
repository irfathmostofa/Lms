# LMS Platform

A fast, role-based Learning Management System for online and offline coaching centers, built on
Next.js (App Router, TypeScript, Tailwind) and Supabase (PostgreSQL, Auth, Storage, Edge Functions).

Admin, Accountant, Instructor, Editor and Student portals cover courses with lessons, online and
manual payments, attendance, assessments and finance in one place. Roles are enforced by Row Level
Security in the database, not only in the UI.

## Features

- **Courses**: Course > Section > Lesson (text, image, PDF, YouTube). Draft > Review > Publish, and
  only an admin publishes.
- **Categories**: parent/child tree up to 4 levels, with course counts that include sub-categories.
- **Online and offline**: online, offline and hybrid courses. Offline courses run in batches with
  venue, schedule, outline and attendance.
- **Enrollment and fees**: admin-managed enrollment, fee records with discount, paid and due
  amounts, and installments.
- **Payments**: SSLCommerz, or manual bKash, Nagad, Rocket and Upay. The student submits the TrxID
  and the admin verifies it. Duplicate TrxIDs are rejected by the database.
- **Teaching**: homework, class tests, assignments and exams, targeted at enrolled students. Marks
  and feedback go to each student's own performance page.
- **Store**: sell digital PDFs (access after verified payment) and physical books (stock, shipping,
  order status).
- **Finance**: income and expenses, monthly profit/loss and per-course profitability.
- **Lookups and settings**: one lookups table for statuses and payment-method config, and a grouped
  settings table for rules.

## Roles

| Role | Can do |
| --- | --- |
| Admin | Everything: users, enrollment, publishing, payments, finance, store |
| Accountant | Verify payments, fees, expenses, reports |
| Instructor | Own courses and batches, attendance, assessments, grading |
| Editor | Create and edit content (no publishing, students or finance) |
| Student | Own courses, work, results, attendance, fees, purchases |

## Tech stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase: PostgreSQL, Auth, Storage, Edge Functions
- SSLCommerz plus manual mobile banking for payments; YouTube embeds for video

## Project structure

```
schema.sql                     Full database: tables, triggers, RLS, views, functions, seed
src/app                        Routes (public site, auth, dashboards, payment callbacks)
src/actions                    Server actions for core flows
src/components                 UI primitives and dashboard components
src/lib                        Supabase clients, auth helpers, types, constants, utils
supabase/functions             sslcommerz-init and sslcommerz-ipn Edge Functions
```

## Getting started

1. Create a Supabase project in the region nearest your students (Singapore or Mumbai for
   Bangladesh).

2. Run `schema.sql` once in the SQL Editor.

3. Create Storage buckets: `receipts` and `payment-screenshots` (private), plus `avatars`
   (public). The public `thumbnails` bucket (course images, hero slides, CMS uploads) is
   created by `schema.sql` and `supabase/migrations/20261020_storage_buckets.sql`.

4. Sign up in the app, then promote yourself to admin from the SQL Editor (no auth context):

   ```sql
   update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
   ```

5. Copy `.env.example` to `.env.local` and fill in the values:

   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<server only>
   SSLCOMMERZ_STORE_ID=<id>
   SSLCOMMERZ_STORE_PASSWORD=<password>
   SSLCOMMERZ_IS_LIVE=false
   ```

6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

7. Deploy the Edge Functions and point the SSLCommerz IPN URL at `sslcommerz-ipn`:

   ```bash
   supabase functions deploy sslcommerz-init sslcommerz-ipn
   ```

## Key flows

- **Manual payment**: the student sends money, then submits method, TrxID, sender number and an
  optional screenshot (pending). The admin or accountant verifies it in the queue. A trigger updates
  the fee record and activates the enrollment, or grants download access for store orders.
- **SSLCommerz**: `sslcommerz-init` creates a pending payment. `sslcommerz-ipn` validates the
  transaction with SSLCommerz's validation API (never the redirect), checks the amount, and marks it
  verified. The handler is idempotent.
- **Offline enrollment**: the admin enrolls a student into a batch, a fee record is created, and the
  admin records discounts or installments. The student becomes active when payment is verified.
- **Assessments**: an instructor creates one for a course or batch, enrolled students see it, submit,
  and receive marks and feedback.

## Security

- RLS on every table, default deny. Students read only their own rows.
- Student-facing database views use `security_invoker` so RLS applies through the view.
- New sign-ups are always students; only an admin (or a trusted server context) changes roles.
- Payments: unique TrxID, server-computed totals, student payments always start pending, and every
  money change is audited.
- Secrets (service role key, SSLCommerz credentials) stay in server and Edge Function environments.

## Performance

- Every foreign key and every column used in an RLS policy is indexed, with partial and covering
  indexes for hot queries.
- RLS policies call helpers as `(select fn())`, so they run once per query, not once per row.
- Pre-computed reports come from views and functions (`finance_monthly_pnl`, `vw_course_progress`,
  `vw_student_attendance`, `vw_student_performance`).
- Static public pages (`/courses`, `/courses/[slug]`) use ISR with `revalidate`.
- Server Components by default, parallel fetches, paginated lists, lazy YouTube embeds and
  `next/image`.

## Verification

Before launch, log in as each role and confirm a student cannot read another student's data. Also
check that a duplicate TrxID is rejected, and run `EXPLAIN ANALYZE` on the main dashboard queries.
