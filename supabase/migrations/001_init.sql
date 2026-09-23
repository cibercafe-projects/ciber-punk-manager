-- 001_init.sql — NEON//TASK SYSTEM (idempotente; rodar no SQL Editor do Supabase)
-- Cria schema completo + RLS com with check + trigger de perfil no signup.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null default 'netrunner',
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  eddies integer not null default 0 check (eddies >= 0),
  streak_days integer not null default 0,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  client text,
  due_date date,
  tags text[] not null default '{}',
  status text not null default 'ativo' check (status in ('ativo','arquivado','concluido')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  title text not null,
  description text default '',
  priority text not null default 'media' check (priority in ('alta','media','baixa')),
  difficulty integer not null default 3 check (difficulty between 1 and 5),
  due_date date,
  tags text[] not null default '{}',
  status text not null default 'a_fazer' check (status in ('a_fazer','em_andamento','concluida')),
  checklist jsonb not null default '[]',
  focus_seconds integer not null default 0,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  criterion jsonb not null,
  rarity text not null default 'comum' check (rarity in ('comum','rara','rasas','raras','epica','epicas','especial','especiais','lendária','lendárias')),
  artwork_ref text,
  reward_xp integer not null default 0,
  reward_eddies integer not null default 0,
  unlocked_message text
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  progress integer not null default 0,
  unlocked_at timestamptz,
  primary key (user_id, achievement_id)
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ===== RLS (with check para INSERT/UPDATE passarem) =====

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.missions enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.events enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own missions" on public.missions;
create policy "own missions" on public.missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own unlocks" on public.user_achievements;
create policy "own unlocks" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own events" on public.events;
create policy "own events" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read achievements" on public.achievements;
create policy "read achievements" on public.achievements
  for select to authenticated using (true);

-- ===== Trigger de perfil automático no signup =====

create or replace function public.handle_new_user()
returns trigger security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end $$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
