-- ===================================================================
--  WalkBuddy — PREFLIGHT CHECK (READ ONLY)
--
--  Run this FIRST. It changes nothing — every statement is a SELECT.
--  It tells you what run_all.sql would do to your existing project, and
--  flags the one condition that can make the migration fail.
-- ===================================================================

-- 1. Do the expected tables exist, and how many rows are in them?
--    (run_all.sql only ADDS columns to these — it never drops or
--    rewrites them, so these counts must be identical afterwards.)
select
  'row counts (record these, re-run after migrating to confirm)' as check,
  (select count(*) from public.profiles)            as profiles,
  (select count(*) from public.profile_preferences) as profile_preferences,
  (select count(*) from public.safety_settings)     as safety_settings;

-- 2. BLOCKER: the migration creates a UNIQUE index on profile_id.
--    If either query returns any rows, the migration WILL FAIL at that
--    step (harmlessly — it aborts). Clean the duplicates first.
select 'DUPLICATE profile_preferences.profile_id' as problem,
       profile_id, count(*) as copies
from public.profile_preferences
group by profile_id having count(*) > 1;

select 'DUPLICATE safety_settings.profile_id' as problem,
       profile_id, count(*) as copies
from public.safety_settings
group by profile_id having count(*) > 1;

-- 3. Is RLS currently on? run_all.sql ENABLES it on these three tables.
--    If it is currently OFF, access rules will tighten after migrating:
--    clients will only see their own rows. This is the intended, secure
--    behaviour, but it IS a behaviour change worth knowing about.
select relname as table_name,
       relrowsecurity as rls_enabled_now
from pg_class
where relname in ('profiles', 'profile_preferences', 'safety_settings')
  and relnamespace = 'public'::regnamespace;

-- 4. Which policies exist today? run_all.sql replaces ONLY policies
--    whose names appear in this list:
--      profiles_select_own / profiles_insert_own / profiles_update_own
--      prefs_select_own    / prefs_insert_own    / prefs_update_own
--      safety_select_own   / safety_insert_own   / safety_update_own
--    Any policy with a different name is left untouched.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'profile_preferences', 'safety_settings')
order by tablename, policyname;

-- 5. Does a handle_new_user() function already exist?
--    run_all.sql does CREATE OR REPLACE on it. If you have your own
--    version doing something extra, IT WILL BE OVERWRITTEN — copy the
--    body below somewhere safe first.
select p.proname as function_name,
       pg_get_functiondef(p.oid) as current_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'handle_new_user';

-- 6. Existing triggers on auth.users. run_all.sql drops and recreates
--    only "on_auth_user_created"; anything else here is left alone.
select tgname as trigger_name
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- 7. Do the storage buckets already exist? With "on conflict do nothing"
--    their current settings are preserved as-is.
select id, public, file_size_limit
from storage.buckets
where id in ('trail-images', 'avatars');

-- 8. Column inventory before migrating — diff this against a re-run
--    afterwards to confirm columns were only ADDED, never changed.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'profile_preferences', 'safety_settings')
order by table_name, column_name;
