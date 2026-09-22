# Tasks — 001-neon-task-core

## Sessão 5 — Pré-teste manual (próxima sessão, pendências apuradas)

Bugs encontrados pela investigação pré-teste (todas pendentes):

- [ ] 5.1 **SQL**: criar `supabase/migrations/001_init.sql` completo a partir do data-model.md, com policies RLS **com `with check`** (INSERT/UPDATE de profiles/projects/missões senão save falha), trigger `on_auth_user_created` de perfil, defaults; usuário aplica `001` + `002` no SQL Editor
- [ ] 5.2 **Criar missão é rejeitado no banco**: `Missions.tsx` (`handleCreate`) não gera/envia `code` (`not null`); gerar no client (`<SIGLA2>-nn` por projeto, `crypto.randomUUID()` de `id`). Terminal cria sem `user_id` (RLS rejeita) → incluir `user_id` do perfil e `id` também
- [ ] 5.3 **Offline real**: `tryRemote` (db.ts:17) só enfileira erro com a string `SUPABASE_UNREACHABLE`, que ninguém lança; tratar falhas de fetch/rede (TypeError/'fetch failed') → enfileirar; e `useOffline.online === false` → stash direto sem tentar remoto. `loadAll` deve tolerar erro (lists vazias, sem crash)
- [ ] 5.4 **Profile pós-signup**: `loadProfile` (.maybeSingle) null para usuário novo → adicionar `ensureProfile()` em db.ts (insert derivado do auth user); sem isso XP/eddies nunca somem
- [ ] 5.5 Peer review: dedup loadProfile no boot (getSession + onAuthStateChange); checar Google Fonts linkadas no index.html (Orbitron/Share Tech Mono)
- [ ] 5.6 **Teste manual do usuário**: rodar 001+002 no SQL Editor → `npm run dev`: criar conta → projeto → missão → completar (XP/toast/som) → Kanban drag → Focus → Terminal → Config
- [ ] 5.7 Opcional: limpar sons não usados (`call-cyber`, `coffe`, `death-long`, `electronic`, `phone-call`), como fez com fontes

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

- [x] 2.1 `Projects.tsx`: CRUD + filtro + progresso + painel detalhes + arquivar (1b/3)
- [x] 2.2 `Missions.tsx`: CRUD (prioridade, dificuldade, prazo, tags, checklist 8 itens) (4)
- [x] 2.3 `rewards` integrado: concluir missão → xp/eddies → evento + toast + som; idempotente (FR-005/005a/011)
- [x] 2.4 `Dashboard.tsx`: stats, gráfico produtividade, próxima missão + INICIAR MISSÃO (2)

## Fase 3 — Operacional (P2, Session 3)

- [x] 3.1 `Kanban.tsx`: 3 colunas, drag-and-drop (Framer), + NOVA TAREFA, drag→concluída passa pela rewards (5)
- [x] 3.2 `FocusMode.tsx`: timer, heartbeat persistindo focus_seconds, PAUSAR/CONCLUIR/ABORTAR (6)
- [x] 3.3 `Achievements.tsx`: grid com critérios/progresso + filtros (7)
- [x] 3.4 `Album.tsx`: cartas colecionáveis, bloqueadas com ???, contador coletadas (7)

## Fase 4 — Extras (P3, Session 4)

- [x] 4.1 `Terminal.tsx`: comandos NT$ (help/projects/archive/missions/create/complete/focus/stats/achievements/exit) via repositórios (8)
- [x] 4.2 `Settings.tsx`: background (sólido/imagem/heroi + opacidade), sons on/off/volume, conta (handle/desconectar), persistido no store ui
- [x] 4.3 Polimento: glitch/flicker em títulos, scanlines nos painéis/terminal, responsive build; sfx aguardando arquivos do usuário (public/sfx)
