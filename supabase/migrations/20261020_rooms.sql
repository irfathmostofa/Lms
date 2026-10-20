create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  capacity    int,
  location    text,
  notes       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.batches
  add column if not exists room_id uuid references public.rooms(id) on delete set null;

alter table public.class_sessions
  add column if not exists room_id uuid references public.rooms(id) on delete set null;

create index if not exists batches_room_idx on public.batches(room_id);
create index if not exists class_sessions_room_idx on public.class_sessions(room_id, session_date);

alter table public.rooms enable row level security;

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select using ((select public.is_staff()));

drop policy if exists rooms_write on public.rooms;
create policy rooms_write on public.rooms
  for all using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.rooms to service_role;
