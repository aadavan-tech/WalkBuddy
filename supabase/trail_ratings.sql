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
