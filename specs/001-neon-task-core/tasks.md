# Tasks — 001-neon-task-core

Checklist implementável, ordem P1 → P3. Gate por fase: `npm run build` + `npm run lint` + verificação manual (quickstart.md).

## Fase 1 — Fundação (P1, Session 1)

- [ ] 1.1 SQL: substituir seed se necessário; rodar `supabase/migrations/002_achievements_seed.sql` no SQL Editor (service key/sql editor, não anon).
- [ ] 1.2 `src/index.css` tema completo `@theme` + scanlines/glitch utilities
- [x] 1.3 Componentes base: `NeonPanel`, `NeonButton`, `ProgressBar`, `StatCard`, `GlitchText`, `Toast` (feedback visual)
- [x] 1.4 `src/lib/audio.ts` (Howler): volumes on/off, sfx placeholder (arquivos do usuário depois, on/off funcional)
- [x] 1.5 Stores Zustand: `session`, `ui` (config), `offlineQueue`
- [x] 1.6 `src/lib/db/*` repositórios sobre supabase-js — implementado como `src/lib/db.ts` único (single-user, YAGNI)
- [x] 1.7 `src/lib/offline.ts`: fila persistida + sync on reconnect + banner no header
- [x] 1.8 `src/lib/rewards.ts`: fórmula xp/eddies, nível (120×), avaliação de conquistas, feedback
- [x] 1.9 Auth: página `Login.tsx` + guard de rotas + sessão persistente (react-router-dom)
- [x] 1.10 Layout: sidebar com 9 rotas + header usuário/nível (eddie/xp) — navegação funcional com placeholders

## Fase 2 — Núcleo (P1, Session 2)

- [ ] 2.1 `Projects.tsx`: CRUD + filtro + progresso + painel detalhes + arquivar (1b/3)
- [ ] 2.2 `Missions.tsx`: CRUD (prioridade, dificuldade, prazo, tags, checklist 8 itens) (4)
- [ ] 2.3 `rewards` integrado: concluir missão → xp/eddies → evento + toast + som; idempotente (FR-005/005a/011)
- [ ] 2.4 `Dashboard.tsx`: stats, gráfico produtividade, próxima missão + INICIAR MISSÃO (2)

## Fase 3 — Operacional (P2, Session 3)

- [ ] 3.1 `Kanban.tsx`: 3 colunas, drag-and-drop (Framer), + NOVA TAREFA, drag→concluída passa pela rewards (5)
- [ ] 3.2 `FocusMode.tsx`: timer, heartbeat persistindo focus_seconds, PAUSAR/CONCLUIR/ABORTAR (6)
- [ ] 3.3 `Achievements.tsx`: grid com critérios/progresso + filtros (7)
- [ ] 3.4 `Album.tsx`: cartas colecionáveis, bloqueadas com ???, contador coletadas/eddies gastos (7)

## Fase 4 — Extras (P3, Session 4)

- [ ] 4.1 `Terminal.tsx`: comandos NT$ (help/projects/missions/complete/create/stats/focus/achievements/exit) via repositórios (8)
- [ ] 4.2 `Settings.tsx`: background (sólido/imagem/aleatório + opacidade), sons/volumes, conta, salvar em profiles.config (9)
- [ ] 4.3 Polimento: glitch nas transições, sounds completos, responsive básico
