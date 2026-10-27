-- IntervU database schema for Supabase.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- Safe to run again: every statement is idempotent.

-- ───────────── Tables ─────────────

-- One row per user: saved resume text, avatar, last interview setup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint profiles_data_size check (pg_column_size(data) < 200000)
);

-- One row per interview: settings, transcript and report, stored as JSON.
create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_id_length check (char_length(id) between 8 and 64),
  constraint sessions_data_size check (pg_column_size(data) < 1000000)
);

create index if not exists sessions_user_updated_idx on public.sessions (user_id, updated_at desc);

-- ───────────── Row Level Security: each user sees only their own rows ─────────────

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "profiles: delete own" on public.profiles;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles: delete own" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "sessions: read own" on public.sessions;
drop policy if exists "sessions: insert own" on public.sessions;
drop policy if exists "sessions: update own" on public.sessions;
drop policy if exists "sessions: delete own" on public.sessions;

create policy "sessions: read own" on public.sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "sessions: insert own" on public.sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sessions: update own" on public.sessions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sessions: delete own" on public.sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ───────────── Access for the Data API ─────────────
-- Signed-in users only. Visitors who are not logged in get nothing.

revoke all on public.profiles, public.sessions from anon;
grant select, insert, update, delete on public.profiles, public.sessions to authenticated;

-- ───────────── Account deletion ─────────────
-- Lets a signed-in user delete their own account. Their profile and interviews
-- are removed automatically through "on delete cascade".

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
