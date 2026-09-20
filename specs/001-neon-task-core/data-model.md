# Data Model — 001-neon-task-core

SQL de migração completa a ser aplicada no Supabase do VPS em `supabase/migrations/001_init.sql`.

## Tabelas

```sql
-- perfil 1:1 com auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null default 'netrunner',
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  eddies integer not null default 0 check (eddies >= 0),
  streak_days integer not null default 0,
  config jsonb not null default '{}',   -- background, sons, volumes, tema
  created_at timestamptz not null default now()
);

create table public.projects (
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

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,                    -- BRAKA-042 (seq curta por usuário)
  title text not null,
  description text default '',
  priority text not null default 'media' check (priority in ('alta','media','baixa')),
  difficulty integer not null default 3 check (difficulty between 1 and 5),
  due_date date,
  tags text[] not null default '{}',
  status text not null default 'a_fazer' check (status in ('a_fazer','em_andamento','concluida')),
  checklist jsonb not null default '[]', -- até 8 itens {text,done}
  focus_seconds integer not null default 0,
  position integer not null default 0,
  completed_at timestamptz,              -- guard de idempotência (FR-005a/FR-011)
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

-- conquistas são globais (seed na migração)
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  criterion jsonb not null,              -- {type: 'missions_completed', target: N} | 'focus_minutes' | 'level' | 'project_done'
  rarity text not null default 'comum' check (rarity in ('comum','rara','epica','lendária','especial')),
  artwork_ref text,                      -- > mesma pasta de assets/imagens do usuário
  reward_xp integer not null default 0,
  reward_eddies integer not null default 0,
  unlocked_message text
);

create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  progress integer not null default 0,
  unlocked_at timestamptz,
  primary key (user_id, achievement_id)
);

create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                    -- xp | eddies | achievement | mission_completed | focus | login
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

## RLS

```sql
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.missions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.events enable row level security;

create policy "own profile" on public.profiles using (auth.uid() = id);
create policy "own projects" on public.projects using (auth.uid() = user_id);
create policy "own missions" on public.missions using (auth.uid() = user_id);
create policy "own unlocks"  on public.user_achievements using (auth.uid() = user_id);
create policy "own events"   on public.events using (auth.uid() = user_id);
-- achievements (catálogo): select autenticado, sem alteração por users
alter table public.achievements enable row level security;
create policy "read achievements" on public.achievements for select to authenticated using (true);
```

## Conquistas seed (v1)

- `night_runner` — Complete 10 missões após 22:00
- `street_samurai` — Complete 50 missões
- `corpo_breaker` — Complete um projeto inteiro
- `foco_extremo` — Fique 4h em focus sem pausa
- `eficiencia` — Complete 20 missões sem prato estourado
- `lendario` — Complete 100 missões
- `morador_bloco` — 7 dias de streak
- `legend_corpo` — Alcance nível 10 → **NEEDS CLARIFICATION**: lista final de conquistas (artwork/critérios) a fechar com o usuário.

## Perfil automático

```sql
create or replace function public.handle_new_user() returns trigger security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$ language plpgsql;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
```
