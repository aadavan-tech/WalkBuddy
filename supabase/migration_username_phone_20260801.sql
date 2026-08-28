-- WalkBuddy username + phone profile migration
-- Additive migration for the existing Supabase project.
--
-- NOTE ON THE TWO FIXES BELOW (this file previously failed to run):
--   1. `create policy if not exists` is NOT valid PostgreSQL — CREATE POLICY
--      has no IF NOT EXISTS form. Replaced with drop-then-create.
--   2. profiles.id is TEXT in this project (not uuid), so auth.uid() must be
--      cast: `auth.uid()::text = id`. Without the cast Postgres raises
--      "operator does not exist: uuid = text".
--
-- Safe to re-run.

alter table public.profiles
  add column if not exists username text,
  add column if not exists country_code text,
  add column if not exists phone_number text,
  add column if not exists bio text;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create unique index if not exists profiles_phone_number_idx
  on public.profiles (phone_number)
  where phone_number is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format_chk,
  add constraint profiles_username_format_chk
    check (
      username is null or (
        length(trim(username)) between 3 and 20
        and username !~ '^_'
        and username ~ '^[A-Za-z0-9_]+$'
      )
    );

alter table public.profiles
  drop constraint if exists profiles_phone_number_digits_chk,
  add constraint profiles_phone_number_digits_chk
    check (
      phone_number is null or phone_number ~ '^\d{7,15}$'
    );

create or replace function public.ensure_username_format(username_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
begin
  normalized := trim(username_input);
  if normalized is null or normalized = '' then
    raise exception 'Username is required';
  end if;

  if length(normalized) < 3 or length(normalized) > 20 then
    raise exception 'Username must be 3-20 characters long';
  end if;

  if normalized like '\_%' then
    raise exception 'Username cannot start with an underscore';
  end if;

  if normalized !~ '^[A-Za-z0-9_]+$' then
    raise exception 'Username can only contain letters, numbers, and underscores';
  end if;

  return normalized;
end;
$$;

-- Keep the existing row-level policy behaviour. These match the policies
-- already created by run_all.sql — recreated here so this file is
-- self-contained and idempotent.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid()::text = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid()::text = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

-- PostgREST caches the schema; force it to pick the new columns up.
notify pgrst, 'reload schema';
