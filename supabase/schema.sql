-- =====================================================================
--  WalkBuddy — onboarding schema (FRESH PROJECTS ONLY)
--
--  !! Do NOT run this on hawpplpfychvjahaywum. That project already has
--  !! profiles / profile_preferences / safety_settings with a different
--  !! shape, and `create table if not exists` silently skips them, so the
--  !! onboarding columns never get added. Use migration_onboarding.sql
--  !! there instead — it is additive and keys off profile_id.
--
--  This file remains as the reference schema for a brand-new project.
--  Safe to re-run: every statement is idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
--  profiles — one row per authenticated user (Google sign-in + personal info)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text,
  full_name            text,
  username             text,
  age                  integer check (age is null or (age >= 13 and age <= 120)),
  gender               text,
  phone                text,
  country_code         text,
  phone_number         text,
  avatar_url           text,
  bio                  text,
  weight_kg            numeric(5, 2),
  daily_steps_goal     integer default 10000,
  city                 text,
  onboarding_completed boolean not null default false,
  terms_accepted       boolean not null default false,
  terms_accepted_at    timestamptz,
  marketing_opt_in     boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint profiles_username_format_chk
    check (
      username is null or (
        length(trim(username)) between 3 and 20
        and username !~ '^_' 
        and username ~ '^[A-Za-z0-9_]+$'
      )
    ),
  constraint profiles_phone_number_digits_chk
    check (
      phone_number is null or phone_number ~ '^\d{7,15}$'
    )
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create unique index if not exists profiles_phone_number_idx
  on public.profiles (phone_number)
  where phone_number is not null;

-- ---------------------------------------------------------------------
--  profile_preferences — survey screen: how the user likes to move
-- ---------------------------------------------------------------------
create table if not exists public.profile_preferences (
  user_id                  uuid primary key references public.profiles (id) on delete cascade,
  preferred_activities     text[]  not null default '{}',   -- Walking / Jogging / Sprinting
  experience_level         text,                            -- Beginner / Intermediate / Advanced
  preferred_times          text[]  not null default '{}',   -- Sunrise / Morning / Afternoon / Evening / Night
  weekly_goal_km           numeric(6, 2),
  daily_steps_goal         integer,
  typical_pace             text,                            -- Relaxed / Steady / Brisk / Race
  terrain_preferences      text[]  not null default '{}',   -- Park trail / Lakeside / City street / Hills
  group_size_preference    text,                            -- Solo / One buddy / Small group / Large group
  buddy_gender_preference  text,                            -- Any / Same gender as me / Prefer not to say
  audio_preference         text,                            -- Music / Podcast / Nature sounds / Silence
  motivations              text[]  not null default '{}',   -- Weight loss / Endurance / Mental health / Social
  max_buddy_distance_km    numeric(5, 2) default 5,
  ai_coach_opt_in          boolean not null default true,
  push_notifications       boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  safety_settings — survey screen: safety + privacy answers
-- ---------------------------------------------------------------------
create table if not exists public.safety_settings (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  share_live_location     boolean not null default true,
  daylight_hours_only     boolean not null default false,
  verified_buddies_only   boolean not null default true,
  women_only_matching     boolean not null default false,
  profile_visibility      text    not null default 'Buddies only',  -- Public / Buddies only / Private
  share_route_history     boolean not null default false,
  auto_checkin_minutes    integer default 30,
  sos_shortcut_enabled    boolean not null default true,
  emergency_contact_name  text,
  emergency_contact_phone text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Row Level Security — a user may only touch their own rows
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.safety_settings     enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "prefs_select_own" on public.profile_preferences;
create policy "prefs_select_own" on public.profile_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "prefs_insert_own" on public.profile_preferences;
create policy "prefs_insert_own" on public.profile_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "prefs_update_own" on public.profile_preferences;
create policy "prefs_update_own" on public.profile_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "safety_select_own" on public.safety_settings;
create policy "safety_select_own" on public.safety_settings
  for select using (auth.uid() = user_id);

drop policy if exists "safety_insert_own" on public.safety_settings;
create policy "safety_insert_own" on public.safety_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "safety_update_own" on public.safety_settings;
create policy "safety_update_own" on public.safety_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
--  Auto-create a profile row the moment a Google user signs up.
--  The client also calls ensureProfile() as a belt-and-braces fallback.
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
    new.id,
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
