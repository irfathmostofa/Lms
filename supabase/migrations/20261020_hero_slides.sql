create table if not exists public.hero_slides (
  id              uuid primary key default gen_random_uuid(),
  eyebrow         text,
  title           text not null,
  description     text,
  image_url       text not null,
  href            text,
  cta_label       text,
  secondary_href  text,
  secondary_label text,
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists hero_slides_active_idx on public.hero_slides(is_active, sort_order);

drop trigger if exists hero_slides_touch on public.hero_slides;
create trigger hero_slides_touch
  before update on public.hero_slides
  for each row execute function public.touch_updated_at();

alter table public.hero_slides enable row level security;

drop policy if exists hero_slides_read on public.hero_slides;
create policy hero_slides_read on public.hero_slides
  for select using (is_active or (select public.is_admin()));

drop policy if exists hero_slides_admin on public.hero_slides;
create policy hero_slides_admin on public.hero_slides
  for all using ((select public.is_admin())) with check ((select public.is_admin()));
