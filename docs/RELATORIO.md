# Relatório de Progresso — NEON//TASK SYSTEM

Data: 2026-09-21 · Doc: docs/RELATORIO.md

## 10. Sessão 2026-09-21 (cont.) — SFX/fontes + investigação pré-teste

- **SFX do usuário integrados** (`7c7fd8c`, `cf66d9f`): click (game/electronic), reward (money), unlock (level-up1), error (death); level-up = sorteio level-up2-6; recharge.ogg a cada bloco 25min do Focus; hacks.ogg ao abrir o Terminal. Feedback de recompensas centralizado em `src/lib/feedback.ts` (`notifyRewards` + `detectLevelUp`), usado por Missions/Dashboard/Kanban/Focus/Terminal.
- **Fontes do usuário integradas via @theme** (`02fc059`): `font-cyber` (Cyberpunk-Regular) nos títulos; tokens `font-body` (Blender Pro) e `font-kepler` (Kepler Std). Podado para 6 arquivos (~260 KB) em `684c715`.
- **Investigação pré-primeiro-teste** (subagent, read-only) achou 4 bugs/1 pendência de banco — detalhados como checklist 5.1–5.7 no final de `tasks.md`:
  1. 001_init.sql inexistente (só data-model) + RLS sem `with check` + trigger de profile ausente;
  2. criar missão falha: Missions não envia `code`, Terminal não envia `user_id`;
  3. offline real: nada detecta falha de rede (tryRemote checa string nunca lançada); loadAll crasha offline;
  4. profile não existe para signup novo → XP nunca concedido;
  5. dedup loadProfile/Google Fonts (menor).
- **Próxima sessão**: implementar 5.1–5.5, rodar SQL do Supabase, então teste manual completo do usuário (5.6).

## 9. Sessão 2026-09-21 — Fases 1–4 concluídas (app completo)

Implementação integral do `tasks.md` em 4 commits (branch `001-neon-task-core`):

- **`5cd0a57` Fase 1 (UI shell)**:
  - Componentes base em `src/components/`: `NeonPanel`, `NeonButton`, `Progress`, `StatCard`, `GlitchText`, `Toast` (provider + `useToast`).
  - `src/lib/audio.ts` — Howler com on/off + volume via store `ui`; sfx aponta para `/sfx/*` (silêncio até os arquivos do usuário).
  - `src/stores/session.ts` (auth/profile) e `ui.ts` (config persistída, incl. backdrop/volume).
  - `src/lib/offline.ts` — sync ao reconectar + banner `OFFLINE // N OPS` no header.
  - `src/pages/Login.tsx` (entrar/criar conta) + guard de rotas + sessão persistente (react-router-dom instalado); 9 rotas com sidebar + header lv/XP/eddies.
  - **Bug corrigido**: inversão de lógica em `completeMission` (concedia recompensa quando falhava).
- **`86894e2` Fase 2 (núcleo)**:
  - `src/stores/data.ts` — cache compartilhado projects/missions.
  - Projects CRUD + filtro ativo/arquivado/concluído + arquivar/reativar + progresso por missões.
  - Missions CRUD completo (prioridade, dificuldade 1–5 com recompensa prevista, prazo, tags, checklist ≤8 clicável, iniciar).
  - Recompensas integradas: XP/₡ + toast + sfx reward/unlock + conquistas em cascata.
  - Dashboard: 5 StatCards, gráfico 7 dias, painel lv/XP/eddies/streak, "próxima missão" priorizada com iniciar/completar.
- **`2234f83` Fase 3 (operacional)**:
  - Kanban 3 colunas com drag-and-drop (Framer Motion, hit-test por pointer) — soltar em CONCLUÍDAS concede recompensas.
  - Focus Mode: timer, heartbeat a cada 30s persistindo `focus_seconds`, blocos 25min, pausar/concluir/abortar.
  - Conquistas: grid com progresso ao vivo (db + cálculo local) e filtros.
  - Álbum: cartas 3:4, bloqueadas `???`, contador.
- **`c2fad82` Fase 4 (extras)**:
  - Terminal NT$ (help/projects/archive/missions/create/complete/focus/stats/achievements/exit).
  - Settings: background sólido/imagem/aleatório + opacidade aplicada no layout, som on/off + volume, handle, desconectar.
  - Polimento: glitch/flicker nos títulos, scanlines, z-layers de backdrop.

- Gate `npm run build` + `npm run lint` OK em todas as fases (warnings triviais: oxlint purity/fast-refresh).
- **Pendências do usuário**: rodar `002_achievements_seed.sql` no SQL Editor; testar fluxo completo em `npm run dev`; soltar `click/reward/unlock/error` em `public/sfx/`; emblema/conquistas: salvá-los no histórico via Terminal. Pull request/merge para `main` quando o usuário validar as telas.

## 6. Sessão 2026-09-20 — Spec base criada

- Commit inicial entregue: `599fb74` (branch `main`).
- `/speckit.specify` executado via script `.specify/scripts/powershell/create-new-feature.ps1 "neon-task-core"`:
  - Branch `001-neon-task-core` criado; `specs/001-neon-task-core/spec.md` preenchida.
- Decisões ratificadas com o usuário:
  1. **Escopo**: spec única com as 9 telas (implementação incremental por stories P1→P3).
  2. **Gamificação**: conforme mockup — XP/eddies por prioridade+dificuldade da missão, conquistas derivadas de eventos/stats, tudo centralizado num módulo de recompensas (Regra FR-004).
  3. **Uso**: single-user (sem convites), mas schema já multi-usuário com RLS.
  4. **Backgrounds**: imagem local do usuário com opacidade ajustável (fallback sólido neon).
- Pendências marcadas na spec (NEEDS CLARIFICATION): comportamento offline do Supabase; se drag-and-drop para "Concluídas" no Kanban concede recompensa; efeito de deletar projeto com missões.
- Próximo: `/speckit.clarify` para resolver as ambiguidades acima → `/speckit.plan` (schema SQL).

## 7. Sessão 2026-09-20 (cont.) — Clarify + Plan

- **Clarify** (4 decisões do usuário):
  1. **Offline-first**: mutações enfileiradas localmente, sync ao voltar, banner pendentes.
  2. **Kanban**: drag para Concluídas TAMBÉM concede recompensa (mesma central idempotente).
  3. **Projeto com missões em aberto**: arquivar (sem delete físico), escondido da lista padrão.
  4. **Recompensa fórmula fixa**: XP = 20×dificuldade×fator_prioridade (1.5/1.2/1.0); eddies = 10×dificuldade.
- **Spec atualizada** (edge cases + FR-005/005a/FR-009).
- **Plan criado** (`specs/001-neon-task-core/plan.md`): arquitetura — `src/lib/db/*` única fronteira de dados, `src/lib/rewards.ts` central de gamificação, `src/lib/offline.ts` fila offline, stores Zustand, 10 páginas em `src/pages/`.
- **Data model** (`data-model.md`): SQL completo — profiles/projects/missions/achievements/user_achievements/events + RLS por user_id + trigger de perfil + idempotência via `completed_at`.
- **Quickstart** (`quickstart.md`): setup Supabase VPS, `.env`, deploy no VPS, checklist de verificação.
- Pendentes: definir lista final de conquistas/artwork; gerar `/speckit.tasks` e implementar.

## 8. Sessão 2026-09-20 (cont.) — Conexão real + fase 1 iniciada

- **Supabase conectado**: `.env` preenchido pelo usuário com credenciais reais; tabelas do data-model aplicadas no VPS (`achievements` acessável por anon key). Verificado com `scripts/test-db.cjs`.
- **Seed vazio**: gerado `supabase/migrations/002_achievements_seed.sql` (8 conquistas: night_runner, street_samurai, corpo_breaker, foco_extremo, eficiencia, lendario, morador_bloco, legend_corpo) — **PENDENTE: rodar no SQL Editor do Supabase** (anon key não pode inserir).
- **`/speckit.tasks` criado**: `specs/001-neon-task-core/tasks.md` — 4 fases (fundação, núcleo, operacional, extras).
- **Fase 1 parcialmente implementada** (commit desta sessão):
  - `src/index.css` — tema completo (32 vars `@theme`: cores, surface2, red, dim) + utilities `neon-border`, `neon-text-*`, `scanlines` + keyframes glitch/flicker/scan.
  - `src/types.ts` — tipos do domínio (Profile, Project, Mission, Achievement, UserAchievement, ChecklistItem).
  - `src/lib/rewards.ts` — central de gamificação: fórmula FR-005, nível (120 XP), progresso de conquistas, cores de raridade.
  - `src/lib/db.ts` — repositório único: profiles/projects/missions (upsert com stash offline), `completeMission` idempotente guard por `completed_at`, `grantProfileGain`, `checkAchievements` (upsert progresso + unlock + eventos), `addFocusSeconds`, `syncQueue`.
  - `src/stores/offline.ts` — fila de mutações persistida (Zustand persist) com flush idempotente.
  - Gate `npm run build` + `npm run lint` passando.
- **Amanhã (retomar em tasks.md)**: continuar 1.2–1.10 — componentes base (`NeonPanel`, `NeonButton`, `ProgressBar`, `StatCard`, `Toast`), `lib/audio.ts`, stores session/ui, página Login + rotas + sidebar.
- Antes de codar: rodar o seed 002 no SQL Editor.

## 1. Decisões de Stack

| Camada     | Escolha                                          | Motivo                                     |
| ---------- | ------------------------------------------------ | ------------------------------------------ |
| Base       | Vite + React + TypeScript                        | SPA com 9 telas, hot reload rápido         |
| Estilo     | Tailwind CSS v4 (`@theme`)                       | Neon/glitch/scanlines padronizados         |
| Animações  | Framer Motion                                    | Glitch nas transições, micro-interações    |
| Estado     | Zustand                                          | Minimalista para estado de sessão/UI       |
| Sons       | Howler.js                                        | Controle fácil dos efeitos sonoros do user |
| Dados/Auth | Supabase (auto-hospedado no VPS do usuário)      | Multi-usuário, login e-mail/senha, RLS     |

- Persistência: **Supabase desde o início** (usuário tem instância própria no VPS e subirá a web app lá).
- Fontes: Orbitron + Share Tech Mono (via Google Fonts).
- Referências visuais: `files/exemplo1-3` (mockups dos painéis); app terá: Dashboard, Projetos, Missões, Kanban, Focus Mode (timer), Conquistas/Álbum, Terminal, Configurações.

## 2. Projeto Inicializado

- Scaffold Vite + React + TS criado na raiz (`src/`, `index.html`, `vite.config.ts`, `tsconfig*`).
- Dependências instaladas: `tailwindcss @tailwindcss/vite zustand framer-motion howler @supabase/supabase-js` (+ `@types/howler`).
- Configurado:
  - `vite.config.ts` com plugins react + tailwind.
  - `src/index.css` com tema neon em `@theme` (cores: bg `#050510`, surface `#0d0d1f`, cyan `#00f0ff`, magenta `#ff2d95`, yellow `#f5d02f`, green `#0aff6c`) e fontes.
  - `src/lib/supabase.ts` — cliente lendo `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` e erro claro se ausente.
  - `.env` (placeholder local) + `.env.example`; `.env` no `.gitignore`.
  - `index.html` com fontes Google e título.
  - `src/App.tsx` placeholder "bootloader" institucional.
- **Build (`tsc -b && vite build`) e lint (oxlint) passando.**

## 3. Spec Kit Inicializado

- Instalado: `uv` (pip) + `specify-cli 1.0.8` (via `uv tool install`; executável em `C:\Users\giselenet\.local\bin`, PATH atualizado — reiniciar shell logo).
- `specify init --here --integration opencode --force --non-interactive --script ps` executado.
- Estrutura criada:
  - `.specify/` — templates (spec/plan/tasks/checklist/constitution), scripts PowerShell, `memory/constitution.md`, workflows.
  - `.opencode/commands/speckit.*` — comandos: constitution, specify, plan, tasks, implement, converge, clarify, analyze, checklist, taskstoissues.
- Constitution ratificada: **`.specify/memory/constitution.md` v1.0.0** (2026-09-17). Princípios:
  1. Visual Neon Não-Negociável (paleta só via `@theme`, fontes Orbitron/Share Tech Mono)
  2. Gamificação Coerente (regras de XP/eddies centralizadas; recompensa com feedback visual + sonoro)
  3. Dados no Supabase com Segurança (camada de repositório única, RLS por `user_id`, nunca service key)
  4. Qualidade Verificável (`tsc && vite build` + lint + verificação manual como gate)
  5. Simplicidade Incremental (YAGNI)
  - Restrições técnicas (stack fixa, segredos em .env, SPA no VPS) + fluxo Spec Kit para toda feature.

## 4. Estado do Git

- Branch `main`, nenhum commit ainda; todo conteúdo base está como untracked (inclui `.specify/`, `.opencode/`, `src/`, `files/`, etc.).

## 5. Próximos Passos

1. **Commit inicial** (quando aprovado): incluir todos os arquivos do scaffold + Spec Kit; mensagem sugerida: `feat: bootstrap NEON//TASK SYSTEM (vite+react+ts, supabase client, speckit v1.0.0)`.
2. `/speckit.specify` — criar a spec base do app (todas as 9 telas/módulos, com base nos mocks de `files/`).
3. `/speckit.clarify` — perguntas estruturadas para reduzir ambiguidade da spec.
4. `/speckit.plan` — plano técnico (stack já decidida; definir modelagem das tabelas).
5. Migrar schema no Supabase do VPS (SQL: perfis, projetos, missões, conquistas; RLS) e preencher `.env` real (URL + anon key).
6. `/speckit.tasks` → `/speckit.implement` → `/speckit.converge` a cada feature.
7. Registrar os sons e fontes do usuário nos assets (ainda pendente de compatibilidade com plataformas e detalhes das pastas).
8. Definir autenticação: primeira tela = login por e-mail/senha (auth + RLS no Supabase).

## Como rodar

```powershell
npm install     # se necessário
npm run dev     # desenvolvimento
npm run build   # gate de qualidade (tsc + build)
npm run lint    # oxlint
specify --help  # CLI do Spec Kit (após reiniciar o shell)
```
