alter table public.categories add column if not exists show_on_home boolean not null default true;

create table if not exists public.site_notices (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  href       text,
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_notices_active_idx on public.site_notices(is_active, starts_at, ends_at);

create table if not exists public.about_page (
  id                 uuid primary key default gen_random_uuid(),
  intro_title        text,
  intro_body         text,
  intro_image_url    text,
  intro_lottie_url   text,
  mission_title      text not null default 'Our mission',
  mission_body       text,
  mission_image_url  text,
  mission_lottie_url text,
  vision_title       text not null default 'Our vision',
  vision_body        text,
  vision_image_url   text,
  vision_lottie_url  text,
  updated_at         timestamptz not null default now()
);

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role_title text,
  bio        text,
  image_url  text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_members_active_idx on public.team_members(is_active, sort_order);

create table if not exists public.partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  href          text,
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  show_on_home  boolean not null default true,
  show_on_about boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists partners_active_idx on public.partners(is_active, sort_order);

create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role_title    text,
  quote         text not null,
  avatar_url    text,
  rating        int not null default 5 check (rating between 1 and 5),
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  show_on_home  boolean not null default true,
  show_on_about boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists testimonials_active_idx on public.testimonials(is_active, sort_order);

create table if not exists public.page_sections (
  key        text primary key,
  label      text not null,
  page       text not null check (page in ('home','about','both')),
  enabled    boolean not null default true,
  sort_order int not null default 0
);

drop trigger if exists site_notices_touch on public.site_notices;
create trigger site_notices_touch before update on public.site_notices
  for each row execute function public.touch_updated_at();
drop trigger if exists about_page_touch on public.about_page;
create trigger about_page_touch before update on public.about_page
  for each row execute function public.touch_updated_at();
drop trigger if exists team_members_touch on public.team_members;
create trigger team_members_touch before update on public.team_members
  for each row execute function public.touch_updated_at();
drop trigger if exists partners_touch on public.partners;
create trigger partners_touch before update on public.partners
  for each row execute function public.touch_updated_at();
drop trigger if exists testimonials_touch on public.testimonials;
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();

alter table public.site_notices enable row level security;
alter table public.about_page enable row level security;
alter table public.team_members enable row level security;
alter table public.partners enable row level security;
alter table public.testimonials enable row level security;
alter table public.page_sections enable row level security;

drop policy if exists site_notices_read on public.site_notices;
create policy site_notices_read on public.site_notices for select using (is_active or (select public.is_admin()));
drop policy if exists site_notices_admin on public.site_notices;
create policy site_notices_admin on public.site_notices
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists about_page_read on public.about_page;
create policy about_page_read on public.about_page for select using (true);
drop policy if exists about_page_admin on public.about_page;
create policy about_page_admin on public.about_page
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists team_members_read on public.team_members;
create policy team_members_read on public.team_members for select using (is_active or (select public.is_admin()));
drop policy if exists team_members_admin on public.team_members;
create policy team_members_admin on public.team_members
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists partners_read on public.partners;
create policy partners_read on public.partners for select using (is_active or (select public.is_admin()));
drop policy if exists partners_admin on public.partners;
create policy partners_admin on public.partners
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists testimonials_read on public.testimonials;
create policy testimonials_read on public.testimonials for select using (is_active or (select public.is_admin()));
drop policy if exists testimonials_admin on public.testimonials;
create policy testimonials_admin on public.testimonials
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists page_sections_read on public.page_sections;
create policy page_sections_read on public.page_sections for select using (true);
drop policy if exists page_sections_admin on public.page_sections;
create policy page_sections_admin on public.page_sections
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.page_sections (key, label, page, enabled, sort_order) values
  ('home_stats','Home stats','home',true,10),
  ('home_featured','Home featured courses','home',true,20),
  ('home_categories','Home category sections','home',true,30),
  ('home_partners','Home partners','home',true,40),
  ('home_testimonials','Home reviews','home',true,50),
  ('home_resources','Home resources','home',true,60),
  ('home_cta','Home call to action','home',true,70),
  ('about_intro','About intro','about',true,10),
  ('about_mission','About mission and vision','about',true,20),
  ('about_team','About team','about',true,30),
  ('about_partners','About partners','about',true,40),
  ('about_testimonials','About reviews','about',true,50)
on conflict (key) do nothing;

insert into public.about_page (intro_title, intro_body, mission_body, vision_body)
select
  'Learn with people who care about your progress.',
  'We help students and professionals build practical skills through structured courses, expert instructors and a learning experience that works online and in person.',
  'Make high-quality teaching accessible, whether you learn from home or in a classroom.',
  'A trusted place where every learner can grow from first lesson to finished skill.'
where not exists (select 1 from public.about_page);
