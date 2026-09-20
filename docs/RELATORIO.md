# Relatório de Progresso — NEON//TASK SYSTEM

Data: 2026-09-20 · Doc: docs/RELATORIO.md

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
