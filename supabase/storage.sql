-- ===================================================================
--  WalkBuddy image storage
--  Run once in the Supabase SQL editor.
--
--  Creates two public buckets and the RLS policies that let signed-in
--  users upload into their own folder while anyone can read.
--    trail-images  route/path photos shown on the feed
--    avatars       profile pictures
-- ===================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('trail-images', 'trail-images', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars', 'avatars', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------
--  Policies. Objects are stored as "<user-id>/<filename>", so the
--  first path segment identifies the owner.
-- ------------------------------------------------------------------

drop policy if exists "Public read of trail images" on storage.objects;
create policy "Public read of trail images"
  on storage.objects for select
  using (bucket_id in ('trail-images', 'avatars'));

drop policy if exists "Users upload their own images" on storage.objects;
create policy "Users upload their own images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('trail-images', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update their own images" on storage.objects;
create policy "Users update their own images"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('trail-images', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete their own images" on storage.objects;
create policy "Users delete their own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('trail-images', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
