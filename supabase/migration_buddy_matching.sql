-- =====================================================================
--  WalkBuddy — proximity buddy matching
--
--  How two users find each other and connect:
--
--    1. Each taps "Find a buddy". That inserts a WAITING match_request
--       holding their current GPS position, activity and search radius.
--    2. The request looks for another waiting user nearby (same activity,
--       inside both users' radius).
--    3. On a hit both requests flip to MATCHED and one `matches` row is
--       created, carrying a MEETING POINT — the midpoint between them.
--    4. Supabase Realtime pushes that row to both clients, so each sees
--       "matched!" and the same spot on the map, and they walk to it.
--
--  Matching runs inside a Postgres function, not the client, because two
--  people can tap the button at the same instant. `for update skip
--  locked` makes each waiting row claimable by exactly one matcher, so
--  nobody gets double-matched.
--
--  Distance uses a plain Haversine in SQL — no PostGIS extension needed.
--
--  Project convention: profiles.id is TEXT, so profile_id is TEXT and
--  every auth.uid() comparison is cast with ::text.
--
--  Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
--  matches — a confirmed pairing plus where to meet
-- ---------------------------------------------------------------------
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  user_a      text not null references public.profiles (id) on delete cascade,
  user_b      text not null references public.profiles (id) on delete cascade,
  category    text not null default 'Walking'
                check (category in ('Walking', 'Jogging', 'Sprinting')),
  -- The shared destination both users walk to.
  meet_lat    double precision not null,
  meet_lng    double precision not null,
  -- How far apart the two were when matched, for display.
  apart_km    double precision,
  status      text not null default 'active'
                check (status in ('active', 'completed', 'cancelled')),
  created_at  timestamptz not null default now(),
  constraint matches_distinct_users check (user_a <> user_b)
);

create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);

-- ---------------------------------------------------------------------
--  match_requests — "I'm looking for a buddy right now"
--  One row per user (primary key), overwritten each time they search.
-- ---------------------------------------------------------------------
create table if not exists public.match_requests (
  profile_id  text primary key references public.profiles (id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  category    text not null default 'Walking'
                check (category in ('Walking', 'Jogging', 'Sprinting')),
  radius_km   double precision not null default 3 check (radius_km between 0.1 and 50),
  status      text not null default 'waiting'
                check (status in ('waiting', 'matched', 'cancelled')),
  match_id    uuid references public.matches (id) on delete set null,
  user_name   text,
  user_avatar text,
  created_at  timestamptz not null default now(),
  -- A search goes stale so users aren't matched to someone long gone.
  expires_at  timestamptz not null default now() + interval '30 minutes'
);

create index if not exists match_requests_waiting_idx
  on public.match_requests (status, expires_at);
create index if not exists match_requests_lat_lng_idx
  on public.match_requests (lat, lng);

-- ---------------------------------------------------------------------
--  Great-circle distance in km. Immutable so it can be used in indexes
--  and called freely inside the matcher.
-- ---------------------------------------------------------------------
create or replace function public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql
immutable
as $$
  select 2 * 6371 * asin(
    sqrt(
      sin(radians(lat2 - lat1) / 2) ^ 2 +
      cos(radians(lat1)) * cos(radians(lat2)) *
      sin(radians(lng2 - lng1) / 2) ^ 2
    )
  );
$$;

-- ---------------------------------------------------------------------
--  find_or_create_match — the matchmaker.
--
--  Registers/refreshes the caller's search, then tries to claim one
--  waiting nearby user. Returns the match row when paired, or NULL while
--  still waiting (the client then waits on Realtime).
--
--  security definer so the function can flip the OTHER user's request to
--  'matched' — their RLS policy would otherwise forbid it.
-- ---------------------------------------------------------------------
create or replace function public.find_or_create_match(
  p_lat       double precision,
  p_lng       double precision,
  p_category  text default 'Walking',
  p_radius_km double precision default 3,
  p_name      text default null,
  p_avatar    text default null
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  me        text := auth.uid()::text;
  candidate public.match_requests;
  new_match public.matches;
  gap_km    double precision;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  -- Register (or refresh) my own search.
  insert into public.match_requests as mr
    (profile_id, lat, lng, category, radius_km, status, match_id,
     user_name, user_avatar, created_at, expires_at)
  values
    (me, p_lat, p_lng, p_category, p_radius_km, 'waiting', null,
     p_name, p_avatar, now(), now() + interval '30 minutes')
  on conflict (profile_id) do update set
    lat = excluded.lat,
    lng = excluded.lng,
    category = excluded.category,
    radius_km = excluded.radius_km,
    status = 'waiting',
    match_id = null,
    user_name = coalesce(excluded.user_name, mr.user_name),
    user_avatar = coalesce(excluded.user_avatar, mr.user_avatar),
    created_at = now(),
    expires_at = now() + interval '30 minutes';

  -- Claim the nearest waiting buddy. `skip locked` means two people
  -- searching at the same moment never grab the same row.
  select *
    into candidate
  from public.match_requests r
  where r.profile_id <> me
    and r.status = 'waiting'
    and r.expires_at > now()
    and r.category = p_category
    -- Must be inside BOTH radii, so neither is dragged too far.
    and public.haversine_km(p_lat, p_lng, r.lat, r.lng) <= least(p_radius_km, r.radius_km)
  order by public.haversine_km(p_lat, p_lng, r.lat, r.lng) asc
  limit 1
  for update skip locked;

  if candidate.profile_id is null then
    return null; -- still waiting; Realtime will deliver the match
  end if;

  gap_km := public.haversine_km(p_lat, p_lng, candidate.lat, candidate.lng);

  -- Meet in the middle so neither walks noticeably further.
  insert into public.matches
    (user_a, user_b, category, meet_lat, meet_lng, apart_km, status)
  values
    (me, candidate.profile_id, p_category,
     (p_lat + candidate.lat) / 2,
     (p_lng + candidate.lng) / 2,
     gap_km, 'active')
  returning * into new_match;

  update public.match_requests
     set status = 'matched', match_id = new_match.id
   where profile_id in (me, candidate.profile_id);

  return new_match;
end;
$$;

-- Cancels my current search.
create or replace function public.cancel_match_request()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.match_requests
     set status = 'cancelled'
   where profile_id = auth.uid()::text
     and status = 'waiting';
end;
$$;

-- ---------------------------------------------------------------------
--  Row Level Security
--
--  A user sees only their own search row and only matches they are part
--  of. The matcher runs security definer, so it can still read other
--  people's waiting rows without exposing them to clients directly.
-- ---------------------------------------------------------------------
alter table public.matches        enable row level security;
alter table public.match_requests enable row level security;

drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own" on public.matches
  for select to authenticated
  using (auth.uid()::text = user_a or auth.uid()::text = user_b);

drop policy if exists "matches_update_own" on public.matches;
create policy "matches_update_own" on public.matches
  for update to authenticated
  using (auth.uid()::text = user_a or auth.uid()::text = user_b)
  with check (auth.uid()::text = user_a or auth.uid()::text = user_b);

drop policy if exists "match_requests_select_own" on public.match_requests;
create policy "match_requests_select_own" on public.match_requests
  for select to authenticated using (auth.uid()::text = profile_id);

drop policy if exists "match_requests_insert_own" on public.match_requests;
create policy "match_requests_insert_own" on public.match_requests
  for insert to authenticated with check (auth.uid()::text = profile_id);

drop policy if exists "match_requests_update_own" on public.match_requests;
create policy "match_requests_update_own" on public.match_requests
  for update to authenticated
  using (auth.uid()::text = profile_id)
  with check (auth.uid()::text = profile_id);

drop policy if exists "match_requests_delete_own" on public.match_requests;
create policy "match_requests_delete_own" on public.match_requests
  for delete to authenticated using (auth.uid()::text = profile_id);

grant execute on function public.find_or_create_match(
  double precision, double precision, text, double precision, text, text
) to authenticated;
grant execute on function public.cancel_match_request() to authenticated;

-- ---------------------------------------------------------------------
--  Realtime — this is how the WAITING user learns they were matched.
--  Their client never polls; the inserted `matches` row is pushed to it.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['matches', 'match_requests'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Realtime payloads carry only changed columns unless the row replicates
-- in full; the client needs user_a/user_b to know the row is for them.
alter table public.matches replica identity full;

notify pgrst, 'reload schema';
