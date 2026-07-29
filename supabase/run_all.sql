-- =====================================================================
--  WalkBuddy — RUN-ALL migration
--
--  Everything you need, in order, for the EXISTING project
--  (hawpplpfychvjahaywum). Paste the whole file into the Supabase SQL
--  editor and hit Run. Safe to re-run — every statement is idempotent.
--
--  >> RUN supabase/preflight_check.sql FIRST. It is read-only and
--  >> reports the one condition that can make this fail (duplicate
--  >> profile_id rows), plus the behaviour changes listed below.
--
--  WHAT THIS DOES **NOT** DO
--    - No DROP TABLE, DROP COLUMN, ALTER COLUMN, DELETE or TRUNCATE.
--    - No existing column is retyped, renamed or removed.
--    - No existing row is modified or deleted.
--    Your current tables and data are preserved.
--
--  BEHAVIOUR CHANGES YOU SHOULD KNOW ABOUT
--    1. Row Level Security is ENABLED on profiles, profile_preferences
--       and safety_settings. If it was off, clients will now only see
--       their own rows.
--    2. Policies named *_select_own / *_insert_own / *_update_own are
--       replaced. Policies with any other name are untouched.
--    3. public.handle_new_user() and the on_auth_user_created trigger
--       are replaced. If you customised either, save a copy first
--       (preflight_check.sql prints the current definition).
--
--  Part 1  Onboarding schema (additive)  <- migration_onboarding.sql
--  Part 2  Image storage buckets         <- storage.sql
--  Part 3  Trail ratings table           <- trail_ratings.sql
--
--  NOTE: do NOT run supabase/schema.sql on this project. It targets a
--  brand-new project and assumes uuid ids / user_id keys, which do not
--  match this project's text ids / profile_id keys.
-- =====================================================================


-- #####################################################################
-- #  PART 1 — ONBOARDING SCHEMA
-- #####################################################################

-- =====================================================================
--  WalkBuddy — onboarding migration (ADDITIVE)
--
--  Run this INSTEAD of schema.sql on project hawpplpfychvjahaywum, which
--  already had profiles / profile_preferences / safety_settings created
--  with a different shape. Nothing here drops or rewrites existing
--  columns or data — it only adds what the onboarding flow needs.
--
--  Two quirks of the existing schema that this migration works around:
--    1. Child rows key off `profile_id`, not `user_id`.
--    2. profiles.id / profile_id are TEXT, not UUID, so every comparison
--       against auth.uid() (which returns uuid) must cast to text.
--
--  Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
--  profiles — add the onboarding columns
--  (already present: id, email, full_name, age, avatar_url, created_at)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists gender               text;
alter table public.profiles add column if not exists phone                text;
alter table public.profiles add column if not exists weight_kg            numeric(5, 2);
alter table public.profiles add column if not exists daily_steps_goal     integer default 10000;
alter table public.profiles add column if not exists city                 text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists terms_accepted       boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at    timestamptz;
alter table public.profiles add column if not exists marketing_opt_in     boolean not null default false;
alter table public.profiles add column if not exists updated_at           timestamptz not null default now();

-- ---------------------------------------------------------------------
--  profile_preferences — add the survey columns
--  (already present: profile_id, experience_level, group_size_preference,
--   preferred_time, goal)
-- ---------------------------------------------------------------------
alter table public.profile_preferences add column if not exists preferred_activities    text[] not null default '{}';
alter table public.profile_preferences add column if not exists preferred_times         text[] not null default '{}';
alter table public.profile_preferences add column if not exists weekly_goal_km          numeric(6, 2);
alter table public.profile_preferences add column if not exists daily_steps_goal        integer;
alter table public.profile_preferences add column if not exists typical_pace            text;
alter table public.profile_preferences add column if not exists terrain_preferences     text[] not null default '{}';
alter table public.profile_preferences add column if not exists buddy_gender_preference text;
alter table public.profile_preferences add column if not exists audio_preference        text;
alter table public.profile_preferences add column if not exists motivations             text[] not null default '{}';
alter table public.profile_preferences add column if not exists max_buddy_distance_km   numeric(5, 2) default 5;
alter table public.profile_preferences add column if not exists ai_coach_opt_in         boolean not null default true;
alter table public.profile_preferences add column if not exists push_notifications      boolean not null default true;
alter table public.profile_preferences add column if not exists updated_at              timestamptz not null default now();

-- ---------------------------------------------------------------------
--  safety_settings — add the safety columns
--  (already present: profile_id, updated_at)
-- ---------------------------------------------------------------------
alter table public.safety_settings add column if not exists share_live_location     boolean not null default true;
alter table public.safety_settings add column if not exists daylight_hours_only     boolean not null default false;
alter table public.safety_settings add column if not exists verified_buddies_only   boolean not null default true;
alter table public.safety_settings add column if not exists women_only_matching     boolean not null default false;
alter table public.safety_settings add column if not exists profile_visibility      text    not null default 'Buddies only';
alter table public.safety_settings add column if not exists share_route_history     boolean not null default false;
alter table public.safety_settings add column if not exists auto_checkin_minutes    integer default 30;
alter table public.safety_settings add column if not exists sos_shortcut_enabled    boolean not null default true;
alter table public.safety_settings add column if not exists emergency_contact_name  text;
alter table public.safety_settings add column if not exists emergency_contact_phone text;

-- ---------------------------------------------------------------------
--  Upsert targets. The client upserts on profile_id, which requires a
--  unique constraint/index on that column. Errors loudly (rather than
--  corrupting anything) if duplicate profile_id rows already exist.
-- ---------------------------------------------------------------------
create unique index if not exists profile_preferences_profile_id_uidx
  on public.profile_preferences (profile_id);

create unique index if not exists safety_settings_profile_id_uidx
  on public.safety_settings (profile_id);

-- ---------------------------------------------------------------------
--  Row Level Security — a user may only touch their own rows
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.safety_settings     enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid()::text = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid()::text = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid()::text = id) with check (auth.uid()::text = id);

drop policy if exists "prefs_select_own" on public.profile_preferences;
create policy "prefs_select_own" on public.profile_preferences
  for select using (auth.uid()::text = profile_id);

drop policy if exists "prefs_insert_own" on public.profile_preferences;
create policy "prefs_insert_own" on public.profile_preferences
  for insert with check (auth.uid()::text = profile_id);

drop policy if exists "prefs_update_own" on public.profile_preferences;
create policy "prefs_update_own" on public.profile_preferences
  for update using (auth.uid()::text = profile_id) with check (auth.uid()::text = profile_id);

drop policy if exists "safety_select_own" on public.safety_settings;
create policy "safety_select_own" on public.safety_settings
  for select using (auth.uid()::text = profile_id);

drop policy if exists "safety_insert_own" on public.safety_settings;
create policy "safety_insert_own" on public.safety_settings
  for insert with check (auth.uid()::text = profile_id);

drop policy if exists "safety_update_own" on public.safety_settings;
create policy "safety_update_own" on public.safety_settings
  for update using (auth.uid()::text = profile_id) with check (auth.uid()::text = profile_id);

-- ---------------------------------------------------------------------
--  Auto-create a profile row on Google signup. The client also calls
--  ensureProfile() as a fallback, so this is belt-and-braces.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
--  Backfill: give the already-signed-in user a profiles row if the
--  trigger did not exist when they first signed in.
-- ---------------------------------------------------------------------
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id::text,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
--  PostgREST caches the schema; force it to pick the new columns up.
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- #####################################################################
-- #  PART 2 — IMAGE STORAGE
-- #####################################################################

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
-- do nothing (not "do update"): if you already have a bucket with one of
-- these names, its existing settings are left exactly as they are.
on conflict (id) do nothing;

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


-- #####################################################################
-- #  PART 3 — TRAIL RATINGS
-- #####################################################################

-- ===================================================================
--  WalkBuddy — trail ratings
--
--  Purely additive: creates ONE new table plus a read-only view. It
--  does not touch profiles, profile_preferences, safety_settings, or
--  any existing data.
--
--  Note on types: this project stores profiles.id as TEXT (not uuid),
--  so profile_id is TEXT here too and every auth.uid() comparison is
--  cast with ::text to match.
-- ===================================================================

create table if not exists public.trail_ratings (
  id         uuid primary key default gen_random_uuid(),
  -- Client-side route id (e.g. "route-1"); routes are not yet a table.
  route_id   text     not null,
  profile_id text     not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One rating per user per trail; the client upserts on this pair.
  constraint trail_ratings_unique_per_user unique (route_id, profile_id)
);

create index if not exists trail_ratings_route_id_idx
  on public.trail_ratings (route_id);

-- ------------------------------------------------------------------
--  Aggregate view — average + count per trail, for the feed cards.
-- ------------------------------------------------------------------
create or replace view public.trail_rating_summary as
  select
    route_id,
    round(avg(rating)::numeric, 2) as average_rating,
    count(*)                       as rating_count
  from public.trail_ratings
  group by route_id;

-- ------------------------------------------------------------------
--  RLS: ratings are public to read (so averages work), but a user may
--  only write their own row.
-- ------------------------------------------------------------------
alter table public.trail_ratings enable row level security;

drop policy if exists "trail_ratings_select_all" on public.trail_ratings;
create policy "trail_ratings_select_all" on public.trail_ratings
  for select using (true);

drop policy if exists "trail_ratings_insert_own" on public.trail_ratings;
create policy "trail_ratings_insert_own" on public.trail_ratings
  for insert with check (auth.uid()::text = profile_id);

drop policy if exists "trail_ratings_update_own" on public.trail_ratings;
create policy "trail_ratings_update_own" on public.trail_ratings
  for update using (auth.uid()::text = profile_id)
             with check (auth.uid()::text = profile_id);

drop policy if exists "trail_ratings_delete_own" on public.trail_ratings;
create policy "trail_ratings_delete_own" on public.trail_ratings
  for delete using (auth.uid()::text = profile_id);

-- Keep updated_at honest on re-rating.
create or replace function public.touch_trail_rating()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trail_ratings_touch on public.trail_ratings;
create trigger trail_ratings_touch
  before update on public.trail_ratings
  for each row execute function public.touch_trail_rating();

notify pgrst, 'reload schema';
