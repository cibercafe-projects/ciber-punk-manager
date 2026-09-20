# Implementation Plan: NEON//TASK SYSTEM — Núcleo do App (9 Telas)

**Branch**: `001-neon-task-core` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-neon-task-core/spec.md`

## Summary

SPA React (Vite + TS) com estética cyberpunk fixa, auth e-mail/senha no Supabase self-hosted, 9 telas (Dashboard, Projetos, Missões, Kanban, Focus Mode, Conquistas, Álbum, Terminal, Configurações), gamificação centralizada (XP/eddies/conquistas com fórmula fixa e conclusão idempotente), dados escopados por `user_id` com RLS e modo offline-first com fila de mutações.

## Technical Context

**Language/Version**: TypeScript 5.x, Node ≥ 20 (Vite 6/7 toolchain)

**Primary Dependencies**: React, Tailwind CSS v4 (`@theme`), Zustand (estado + persist da fila offline), Framer Motion (glitch/transições), Howler.js (sons), @supabase/supabase-js v2

**Storage**: PostgreSQL via Supabase self-hosted (VPS). Cache/fila local: localStorage via Zustand `persist`.

**Testing**: Gate de qualidade = `tsc -b && vite build` + `npm run lint` (oxlint) + verificação manual por story (constituição). Testes unitários de módulo puro (gamificação, fila offline) com Vitest — opcional, não gate.

**Target Platform**: Desktop-first SPA hospedada no VPS do usuário.

**Performance Goals**: Dashboard com dados prontos < 2s; transições 60fps; drag-and-drop sem jank (Framer Motion `layoutId`).

**Constraints**: Paleta/fontes só via `@theme`; recompensas só pela central `src/lib/rewards`; acesso ao Supabase só por `src/lib/repo`; secrets só em `.env`; nunca service key no client.

**Scale/Scope**: Single-user; ~1k missões/projetos; 9 telas + login.

## Constitution Check

- ✅ Visual neon: cores/fontes exclusivamente em `src/index.css` (`@theme`); componentes nunca hardcodam cores.
- ✅ Gamificação coerente: `src/lib/rewards.ts` única fonte de regras; toda concessão gera evento + feedback visual+sonoro.
- ✅ Dados seguros: única camada de acesso `src/lib/db/*` (repositório sobre supabase-js); RLS forçada no SQL; anon key apenas.
- ✅ Qualidade verificável: gate = build + lint + verificação manual por story.
- ✅ Simplicidade incremental: stories P1→P3 entregam valor isolado; sem abstrações à frente da necessidade (YAGNI).

## Project Structure

### Documentation (this feature)

```text
specs/001-neon-task-core/
├── plan.md              # este arquivo
├── data-model.md        # schema SQL + RLS (complemento)
├── quickstart.md        # setup Supabase + .env + deploy
└── tasks.md             # gerado por /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── main.tsx                 # bootstrap: theme, router, providers (audio, auth)
├── App.tsx                  # rotas + guard de sessão + layout (sidebar)
├── index.css                # @theme (cores/fonts) + scanlines/glitch utilities
├── lib/
│   ├── supabase.ts          # cliente único (VITE_SUPABASE_URL/ANON_KEY)
│   ├── rewards.ts           # central de gamificação (fórmula, nível, conquistas)
│   ├── offline.ts           # fila de mutações persistida + sync on reconnect
│   └── db/                  # repositórios (única via de acesso a dados)
│       ├── profile.ts  projects.ts  missions.ts  achievements.ts  events.ts
│   └── audio.ts             # Howler: playlists de sfx/music, volumes
├── stores/                  # zustand: session, ui/config, missions, offline-queue
├── components/              # NeonPanel, NeonButton, StatCard, ProgressBar, Toast,
│   │                        GlitchText, Scanlines, KanbanCard, TerminalView...
├── pages/                   # 1 página por story
│   ├── Login.tsx  Dashboard.tsx  Projects.tsx  Missions.tsx  Kanban.tsx
│   ├── FocusMode.tsx  Achievements.tsx  Album.tsx  Terminal.tsx  Settings.tsx
└── assets/                  # fonts usados, sons do usuário (placeholder), hero
supabase/
└── migrations/
    └── 001_init.sql         # tabelas + RLS + triggers + seed de conquistas
```

**Structure Decision**: Projeto único SPA (raiz), sem monorepo. `lib/db` é a única fronteira de dados; telas nunca importam `supabase-js` diretamente.

## Data Model (resumo — detalhe em data-model.md)

Tabelas (todas com `user_id uuid not null` + RLS `auth.uid() = user_id`):

- `profiles` — 1:1 com auth.users (trigger on signup): handle, avatar, nível derivado de xp, xp, eddies, streak, config UI/sons (jsonb).
- `projects` — título, descrição, cliente, prazo, tags[], status (`ativo|arquivado|concluído`), posição. Soft-archive, sem delete físico.
- `missions` — projeto_id, código (seq curta por usuário), título, prioridade (`alta|média|baixa`), dificuldade 1–5, prazo, tags[], status (`a_fazer|em_andamento|concluida`), checklist jsonb (≤8 itens), focus_seconds, posição, `completed_at` (idempotência).
- `achievements` — global (seed): código, nome, critério (tipo + meta), raridade, reward xp/eddies, artwork ref.
- `user_achievements` — unlock: user_achievement PK (user, achievement), progresso, unlocked_at.
- `events` — log append-only: tipo (xp/eddies/conquista/missão/focus), payload jsonb, criado_em. Alimenta histórico e Álbum.

Recompensa (FR-005): `xp = 20 × dificuldade × fator` (alta 1.5 / média 1.2 / baixa 1.0); `eddies = 10 × dificuldade`. Nível: threshold.cumulativo `xp_nível = 120 × nível` (nível N requer total 120×N). Conclusão idempotente: guard por `completed_at IS NULL` na operação.

## Offline-first

- Repositórios gravam local-first: mutação aplicada no cache Zustand imediato + enfileirada (`offline.ts`, persistida).
- Sync on reconnect (`supabase realtime`/`window online`): fila replayed em ordem; operações idempotentes (upserts + guard `completed_at`).
- Leituras: cache local primeiro; refresh em segundo plano; banner `OFFLINE // N OPS PENDENTES` no header.

## Complexity Tracking

> Nenhuma violação de constituição — sem justificativas pendentes.
