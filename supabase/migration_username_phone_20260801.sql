-- WalkBuddy username + phone profile migration
-- Additive migration for the existing Supabase project.

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

-- Keep the existing row-level policy behavior and only tighten profile access.
create policy if not exists "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy if not exists "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy if not exists "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
