create type post_visibility as enum ('PUBLIC', 'PRIVATE');
create type post_status as enum ('ACTIVE', 'COMPLETED', 'CANCELLED');
create type post_reaction as enum ('INTERESTED', 'NOT_INTERESTED');

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  trail_id uuid not null,
  title text not null,
  description text default '',
  scheduled_at timestamptz not null,
  visibility post_visibility not null default 'PUBLIC',
  status post_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction post_reaction not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;

create policy "Authenticated users can view public posts"
  on public.posts for select
  using (visibility = 'PUBLIC' and auth.role() = 'authenticated');

create policy "Creators can view their private posts"
  on public.posts for select
  using (creator_id = auth.uid());

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.role() = 'authenticated' and creator_id = auth.uid());

create policy "Creators can update their posts"
  on public.posts for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "Creators can delete their posts"
  on public.posts for delete
  using (creator_id = auth.uid());

create policy "Authenticated users can view reactions"
  on public.post_reactions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can upsert their own reactions"
  on public.post_reactions for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "Authenticated users can update their own reactions"
  on public.post_reactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users can delete their own reactions"
  on public.post_reactions for delete
  using (user_id = auth.uid());
