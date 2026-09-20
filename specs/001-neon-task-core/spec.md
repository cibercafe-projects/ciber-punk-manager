# Feature Specification: NEON//TASK SYSTEM — Núcleo do App (9 Telas)

**Feature Branch**: `001-neon-task-core`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Spec base do app completo conforme mockups `files/exemplo1-3`: gerenciador de projetos/missões gamificado com estética cyberpunk (neon/scanlines/glitch), auth Supabase, 9 telas, regras de XP/eddies/conquistas centralizadas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticação e acesso ao sistema (Priority: P1)

Como usuário (single-user), quero logar com e-mail e senha para acessar o sistema. A tela de login é a primeira tela: fundo cyberpunk com painel neon, mensagem de erro inline em `#ff2d95` para credenciais inválidas, feedback sonoro em sucesso/erro. Após login, sessão persiste entre recarregamentos (token em localStorage). Logoff disponível nas Configurações.

**Why this priority**: É a porta de entrada; nada mais funciona sem sessão autenticada.

**Independent Test**: Pode ser testado registrando/logando uma conta no Supabase e verificando que sem login nenhuma tela / painéis / dados carregam.

**Acceptance Scenarios**:

1. **Given** visitante não autenticado em qualquer rota, **When** acessar o app, **Then** é redirecionado para a tela de login.
2. **Given** credenciais válidas, **When** submeter o formulário, **Then** entra no Dashboard, itemId/nível visíveis no header da sidebar.
3. **Given** credenciais inválidas, **When** submeter, **Then** mensagem de erro neon exibida, sem acesso.
4. **Given** sessão ativa, **When** recarregar a página, **Then** permanece logado na mesma rota.
5. **Given** usuário logado, **When** clicar em SAIR, **Then** todos os dados locais de sessão são limpos e volta ao login.

---

### User Story 2 - Dashboard com visão geral e gamificação (Priority: P1)

Como usuário, quero um dashboard com stats gerais (nível/xp-bar, eddies, missões ativas, tempo de focus de hoje), gráfico de produtividade (dias da semana) e card "label próxima missão" com prazo e botão INICIAR MISSÃO.

**Why this priority**: É a primeira tela após login e consolida a gamificação visível.

**Independent Test**: Com alguns projetos/missões cadastrados, carregar o dashboard e conferir que os números refletem o estado do banco em < 2s.

**Acceptance Scenarios**:

1. **Given** conta com 0 dados (primeiro login), **When** abrir dashboard, **Then** sistema mostra zeros (nível 1, 0 XP, 0 eddies, 0 missões) e offers de criar primeiro projeto.
2. **Given** 3 missões ativas e 1 concluída hoje, **When** abrir dashboard, **Then** contadores e gráfico refletem esses valores.
3. **Given** próxima missão com prazo definido, **When** clicar INICIAR MISSÃO, **Then** navigates para Focus Mode com essa missão.

---

### User Story 3 - Projetos (Priority: P1)

Como usuário, quero criar/listar/editar projetos com filtro (todos/ativo/concluído), barras de progresso mediana (percentual de missões concluídas), painel de detalhes (descrição, cliente, prazo, tags, contagem de missões, progresso) e botão ABRIR PROJETO que leva ao Kanban.

**Why this priority**: Projetos agrupam missões; estrutura base do domínio.

**Independent Test**: Criar projeto, adicionar missões, abrir detalhes e verificar progresso correto.

**Acceptance Scenarios**:

1. **Given** tela Projetos, **When** criar projeto com título/descrição, **Then** aparece na lista com progresso 0%.
2. **Given** projeto com 4 missões (2 concluídas), **When** abrir detalhes, **Then** progresso exibe 50%.
3. **Given** filtro por status ativo, **When** listar, **Then** só projetos não concluídos aparecem.
4. **Given** projeto selecionado, **When** clicar ABRIR PROJETO, **Then** navega ao Kanban desse projeto.

---

### User Story 4 - Missões e focus (Priority: P1)

Como usuário, quero gerenciar missões (as tasks) dentro de projetos: com prioridade (alta/média/baixa), dificuldade (1-5), prazo, tags, checklist de sub-tasks (8 slots exibidos como checkboxes do mockup), recompensa estimada (+XP, +eddies, chance de conquista), status ativa/concluída. Completar missão dispara a recompensa com feedback visual + sonoro.

**Why this priority**: É a unidade de trabalho central; gamificação depende dela.

**Independent Test**: Completar uma missão e verificar que XP/eddies/conquista são creditados conforme tabela central.

**Acceptance Scenarios**:

1. **Given** missão definida com checklist, **When** marcar items, **Then** progresso visual atualiza (contagem X/8).
2. **Given** missão ativa, **When** clicar MARCAR CONCLUÍDA, **Then** status muda, XP/eddies creditados e toasts/sons exibidos.
3. **Given** missão com prazo no passado, **When** visualizar, **Then** banner vermelho expirado.

---

### User Story 5 - Kanban por projeto (Priority: P2)

Como usuário, quero um quadro kanban por projeto com colunas A FAZER / EM ANDAMENTO / CONCLUÍDAS, cards com prioridade/projeto/título, drag-and-drop de cards entre colunas, + NOVA TAREFA para criar missão rápida, filtro por projeto.

**Why this priority**: Visão operacional de trabalho; depende de missões.

**Independent Test**: Arrastar missão de A Fazer para Em Andamento e verificar persistência.

**Acceptance Scenarios**:

1. **Given** projeto com missões, **When** abrir kanban, **Then** cards distribuídos por status.
2. **Given** card em A Fazer, **When** arrastar para Em Andamento, **Then** status persiste ao recarregar.
3. **Given** slot "em andamento", **When** houver > 2 em mesmo coluna, **Then** sem limite artificião (lista cresce verticalmente).

---

### User Story 6 - Focus Mode (timer pomodoro) (Priority: P2)

Como usuário, quero focar numa missão com um timer (start/pause), barra de progresso, o tempo acumulado de focus da missão. Botões PAUSAR / CONCLUIR MISSÃO / CANCELAR. Ao concluir via focus, rewards são concedidos.

**Why this priority**: Mecânica central da gamificação, mas depende de missões funcionando.

**Independent Test**: Iniciar focus, aguardar/pausar, verificar que o tempo é registrado na missão.

**Acceptance Scenarios**:

1. **Given** missão selecionada, **When** iniciar focus, **Then** timer começa a rodar em tempo real.
2. **Given** focus em andamento, **When** pausar, **Then** timer congela e tempo acumulado mantém.
3. **Given** focus roando, **When** clicar CONCLUIR MISSÃO, **Then** tempo é registrado + recompensa concedida + navegação de volta.
4. **Given** focus em andamento, **When** clicar ABORTAR, **Then** tempo parcial é descartado e missão permanece ativa.

---

### User Story 7 - Conquistas e Álbum (Priority: P2)

Como usuário, quero ver conquistas (conquistas derivadas de eventos/stats: missões concluídas, streaks, nível, etc.) em grid com progresso (X/Y), filtro por status (todas/em progresso/pendentes/especiais) e recompensa por desbloqueio. Também quero um Álbum de Conquistas em formato cartas colecionáveis (retô fits do mockup 1/2) com contador "coletadas X/Y" e eddies gastos.

**Why this priority**: Recompensa engajamento; depende da central de recompensas estar rodando.

**Independent Test**: Realizar ação que desbloqueia conquista e verificar que ela aparece desbloqueada tanto em Conquistas quanto no Álbum.

**Acceptance Scenarios**:

1. **Given** nova conta, **When** ver conquistas, **Then** todas bloqueadas com critério e progresso 0 disputado.
2. **Given** 10 missões concluídas, **When** completar a 10ª, **Then** conquistas correspondentes disparam notificação de desbloqueio.
3. **Given** conquista desbloqueada, **When** abrir Álbum, **Then** carta visível com artwork/geráculo e cor da raridade; bloqueadas mostram ??? silhueta.

---

### User Story 8 - Terminal (Priority: P3)

Como usuário, quero um terminal interativo NT$ onde posso executar comandos contra os dados do app: `help`, `projects`, `missions`, `complete <id>`, `create`, `stats`, `focus <id>`, `achievements`, `exit`. Respostas an listas tabulares no estilo cyberpunk (verde/cyan).

**Why this priority**: Power-user feature; não bloqueia o resto.

**Independent Test**: No terminal, executar `missions list` e verificar que reflete dados do banco.

**Acceptance Scenarios**:

1. **Given** terminal aberto, **When** ro `help`, **Then** lista de comandos com descrição aparece.
2. **Given** missões cadastradas, **When** ro `missions`, **Then** tabela com id, título, projeto, status.
3. **Given** id válido, **When** ro `complete <id>`, **Then** missão é concluída e resposta confirma com recompensa.

---

### User Story 9 - Configurações (Priority: P3)

Como usuário, quero configurar: fundo (sólido/imagem local/aleatório com opacidade ajustável), sons on/off com volumes separados (efeitos/OFF), conta (email, trocar senha, excluir dados de todos os dados), sobre (versão, créditos). Salvar persiste no banco.

**Why this priority**: Nice-to-have; app funciona sem chỉnhá-lo.

**Independent Test**: Muda um config, salvar, recarregar — valores persistem.

**Acceptance Scenarios**:

1. **Given** imagem/script background local válida, **When** salvar, **Then** background applied em todas as telas.
2. **Given** sons ajustados, **When** recarregar, **Then** volume aplicado.
3. **Given** trocar senha com senha atual correta, **When** salvar, **Then** login funciona com a nova senha.

---

### Edge Cases

- O que acontece se o Supabase estiver inacessível? Mostrar banner offline neon e permitir ações pendentes offline? — **NEEDS CLARIFICATION** (offline-first ou apenas erro inline?).
- O que acontece quando o usuário tenta completar missão que já foi concluída (double-click/race)? Recompensa é aplicada uma única vez (idempotente).
- O que acontece se o timer de focus ultrapassar 24h ou a aba for fechada em foreground? Tempo deve persistir (heartbeat/acc) — reabrir focus retoma do acumulado.
- E se o usuário editar/deletar um projeto com missões ativas? Missões devem ser removidas ou impedir (regra a definir).
- Drag-and-drop para coluna CONCLUÍDAS deve ou não conceder recompensa? — **NEEDS CLARIFICATION**.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema MUST autenticar via e-mail/senha no Supabase, com sessão persistente entre recargas (localStorage).
- **FR-002**: Sistema MUST exigir sessão válida para exibir qualquer dado/tela; ROTAS não autenticadas redirecionam ao login.
- **FR-003**: Sistema MUST escopar 100% dos dados por `user_id` no banco (RLS ativa em todas as tabelas).
- **FR-004**: Sistema MUST centralizar regras de gamificação (XP, eddies, nível, conquistas) em um único módulo de recompensas; nenhuma tela calcula recompensa própria.
- **FR-005**: Sistema MUST conceder XP/eddies ao concluir missão conforme prioridade/dificuldade, com feedback visual (toast + aproject de stats) e sonoro.
- **FR-006**: Sistema MUST registrar eventos de gamificação (ganho de XP, conquista desbloqueada) para o feed/history.
- **FR-007**: Sistema MUST expor as 9 telas com navegação lateral fixa: Dashboard, Projetos, Missões, Kanban, Focus Mode, Conquistas, Álbum, Terminal, Configurações.
- **FR-008**: Estilo visual (paleta via `@theme`, fontes Orbitron/Share Tech Mono, scanlines/glitch, barras de progresso) é não-negociável conforme constituição.
- **FR-009**: Sistema MUST suportar CRUD completo de projetos e missões (com posições, prioridade, prazo, tags, checklst até 8 sub-itens).
- **FR-010**: Timer de focus MUST persistir o tempo acumulado periodicamente (para não perder tempo ao fechar a aba).
- **FR-011**: Conclusão de missão MUST ser idempotente (não concede recompensa dupla).
- **FR-012**: Terminal MUST executar comandos contra os dados reais (mesma camada de repositório, sem acesso direto ao Supabase).
- **FR-013**: Configurações (background, sons, tema) MUST persistir por usuário e ser aplicadas globalmente.
- **FR-014**: Sons (Howler.js) MUST suportar on/off e volumes (efeitos e música) separados.
- **FR-015**: Background de imagem local (async do usuário no VPS) ou fallback sólido neon.

### Key Entities *(include if feature involves data)*

- **perfil**: id (auth user_id), handle, avatar, nível, xp total, eddies, streak dias, config de UI/sons.
- **projeto**: id, user_id, título, descrição, cliente (opcional), prazo, tags, status (ativo/concluído), ordem.
- **missão**: id, user_id, projeto_id, código (id curto tipo BRAKA-042), título, descrição, prioridade, dificuldade 1-5, prazo, tags, status (a_fazer, em_andamento, concluída), checklist (até 8 itens), tempo_focus_acumulado, ordem.
- **conquista**: id, código, nome, descrição, critério (tipo+meta), artwork, raridade/cor, recompensa (xp/eddies).
- **conquista_usuário**: user_id, conquista_id, data_desbloqueio, progresso atual.
- **evento**: id, user_id, tipo (xp_ganho, eddie_ganho, conquista_desbloqueada, missão_concluída, focus_session), payload, timestamp — alimenta histórico e Álbum.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Login funcional com feedback em < 3s por credenciais corretas.
- **SC-002**: Dashboard carrega com stats do banco em < 2s em conexão normal.
- **SC-003**: Todas as 9 telas naveáveis com visual neon conforme mockup, sem referências não-neon fora do `@theme`.
- **SC-004**: Completar uma missão credita exatamente 1 vez a recompensa correta (verificado no banco).
- **SC-005**: `npm run build` + lint passam como gate antes de cada entrega.

## Assumptions

- Uso single-user (sem convites/compartilhamento nesta versão), mas schema já em multi-usuário via RLS.
- Supabase self-hosted no VPS do usuário (dados nunca vão para provedores de terceiro).
- Artwork das cartas de conquista / backgrounds: imagens locais do usuário (assets ou pasta configurada); mockup considera fotos estilo cyberpunk.
- Sons de interface: assets do usuário (arquivos em `files/`, ainda a catalogar).
- Desktop-first; mobile responsivo melhoria futura, não bloqueiante.
- Terminal é client-side, não shell real.
