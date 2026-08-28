-- =====================================================================
--  Loop / WalkBuddy — social graph (Instagram-style follows)
--
--  Adds the relationship layer the app's social features hang off:
--    * find a user by @username
--    * send them a follow request
--    * they accept or decline
--    * "followed" users unlock chat and location-status sharing
--
--  IMPORTANT — why search goes through an RPC, not a table policy:
--  profiles has a select-own-only policy, so one user cannot read another
--  user's row at all. Rather than loosen that (which would expose email,
--  phone, date_of_birth, weight...), discovery is a security-definer
--  function that returns ONLY safe public fields.
--
--  Project convention: profiles.id is TEXT, so every auth.uid() is cast
--  with ::text.
--
--  Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
--  follows — one row per follow relationship
--
--  Directional, like Instagram: follower_id follows following_id.
--  A mutual friendship is simply two accepted rows.
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  -- Who sent the request.
  follower_id  text not null references public.profiles (id) on delete cascade,
  -- Who they want to follow (the one who accepts or declines).
  following_id text not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  -- One relationship per direction; re-requesting updates this row.
  constraint follows_unique_pair unique (follower_id, following_id),
  -- You cannot follow yourself.
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_follower_idx  on public.follows (follower_id, status);
create index if not exists follows_following_idx on public.follows (following_id, status);

-- ---------------------------------------------------------------------
--  is_following(viewer, target)
--
--  True when `viewer` has an ACCEPTED follow on `target`. This is the
--  single gate other features reuse — chat visibility and location
--  status sharing both call it, so the rule lives in exactly one place.
-- ---------------------------------------------------------------------
create or replace function public.is_following(
  p_viewer text,
  p_target text
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows
     where follower_id = p_viewer
       and following_id = p_target
       and status = 'accepted'
  );
$$;

-- True only when BOTH directions are accepted (mutual friendship).
create or replace function public.is_mutual_follow(
  p_a text,
  p_b text
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_following(p_a, p_b) and public.is_following(p_b, p_a);
$$;

-- ---------------------------------------------------------------------
--  search_users(query)
--
--  Find people by @username or display name. Returns ONLY fields that are
--  safe to show publicly — never email, phone, DOB or weight — plus the
--  caller's current relationship with each result so the UI can render
--  Follow / Requested / Following without a second round trip.
-- ---------------------------------------------------------------------
create or replace function public.search_users(
  p_query text,
  p_limit integer default 20
)
returns table (
  id              text,
  username        text,
  full_name       text,
  avatar_url      text,
  city            text,
  follow_status   text,   -- null | pending | accepted | declined
  follows_me      boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.city,
    f_out.status                       as follow_status,
    coalesce(f_in.status = 'accepted', false) as follows_me
  from public.profiles p
  left join public.follows f_out
    on f_out.follower_id = auth.uid()::text and f_out.following_id = p.id
  left join public.follows f_in
    on f_in.follower_id = p.id and f_in.following_id = auth.uid()::text
  where p.id <> auth.uid()::text
    and p.username is not null
    and length(trim(p_query)) >= 2
    and (
      p.username ilike '%' || trim(p_query) || '%'
      or p.full_name ilike '%' || trim(p_query) || '%'
    )
  -- Exact username matches first, then prefix matches, then the rest.
  order by
    (lower(p.username) = lower(trim(p_query))) desc,
    (lower(p.username) like lower(trim(p_query)) || '%') desc,
    p.username asc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ---------------------------------------------------------------------
--  list_follow_connections(kind)
--
--  kind = 'followers'  -> people who follow me (accepted)
--         'following'  -> people I follow (accepted)
--         'requests'   -> incoming requests awaiting my response
--         'sent'       -> my outgoing requests still pending
--
--  Same reasoning as search_users: joins profiles behind a definer
--  function so only safe columns cross the boundary.
-- ---------------------------------------------------------------------
create or replace function public.list_follow_connections(
  p_kind text default 'following'
)
returns table (
  follow_id  uuid,
  id         text,
  username   text,
  full_name  text,
  avatar_url text,
  status     text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    f.status,
    f.created_at
  from public.follows f
  join public.profiles p
    on p.id = case
                when p_kind in ('followers', 'requests') then f.follower_id
                else f.following_id
              end
  where
    case p_kind
      when 'followers' then f.following_id = auth.uid()::text and f.status = 'accepted'
      when 'requests'  then f.following_id = auth.uid()::text and f.status = 'pending'
      when 'sent'      then f.follower_id  = auth.uid()::text and f.status = 'pending'
      else                  f.follower_id  = auth.uid()::text and f.status = 'accepted'
    end
  order by f.created_at desc;
$$;

-- ---------------------------------------------------------------------
--  Row Level Security
--
--  A user sees only relationships they are part of. Requests may only be
--  created as yourself, and only the TARGET can accept or decline —
--  otherwise a requester could approve their own request.
-- ---------------------------------------------------------------------
alter table public.follows enable row level security;

drop policy if exists "follows_select_involved" on public.follows;
create policy "follows_select_involved" on public.follows
  for select to authenticated
  using (auth.uid()::text = follower_id or auth.uid()::text = following_id);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
  for insert to authenticated
  with check (auth.uid()::text = follower_id);

-- Only the person being followed can change the status (accept/decline).
drop policy if exists "follows_update_target" on public.follows;
create policy "follows_update_target" on public.follows
  for update to authenticated
  using (auth.uid()::text = following_id)
  with check (auth.uid()::text = following_id);

-- Either side may remove the link: unfollow, or remove a follower.
drop policy if exists "follows_delete_involved" on public.follows;
create policy "follows_delete_involved" on public.follows
  for delete to authenticated
  using (auth.uid()::text = follower_id or auth.uid()::text = following_id);

grant execute on function public.search_users(text, integer)      to authenticated;
grant execute on function public.list_follow_connections(text)    to authenticated;
grant execute on function public.is_following(text, text)         to authenticated;
grant execute on function public.is_mutual_follow(text, text)     to authenticated;

-- ---------------------------------------------------------------------
--  Realtime — so an incoming follow request appears without a refresh.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'follows'
  ) then
    alter publication supabase_realtime add table public.follows;
  end if;
end $$;

alter table public.follows replica identity full;

notify pgrst, 'reload schema';
