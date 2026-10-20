-- Public image bucket used by course thumbnails, hero slides, and CMS uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists thumbnails_public_read on storage.objects;
create policy thumbnails_public_read
  on storage.objects for select
  using (bucket_id = 'thumbnails');

drop policy if exists thumbnails_staff_insert on storage.objects;
create policy thumbnails_staff_insert
  on storage.objects for insert
  with check (bucket_id = 'thumbnails' and (select public.is_staff()));

drop policy if exists thumbnails_staff_update on storage.objects;
create policy thumbnails_staff_update
  on storage.objects for update
  using (bucket_id = 'thumbnails' and (select public.is_staff()))
  with check (bucket_id = 'thumbnails' and (select public.is_staff()));

drop policy if exists thumbnails_staff_delete on storage.objects;
create policy thumbnails_staff_delete
  on storage.objects for delete
  using (bucket_id = 'thumbnails' and (select public.is_staff()));
