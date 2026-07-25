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
