<!--
SYNC IMPACT REPORT
==================
Version change: (novo) | Ratified: 2026-09-17
Versão inicial   1.0.0
Princípios definidos: I. Visual Neon Não-Negociável | II. Gamificação
Coerente | III. Dados no Supabase com Segurança | IV. Qualidade Verificável |
V. Simplicidade Incremental (YAGNI)
Seções adicionadas: Restrições Técnicas, Fluxo de Desenvolvimento, Governance
Pendências: nenhuma
-->

# NEON//TASK SYSTEM Constitution

## Core Principles

### I. Visual Neon Não-Negociável

Toda interface MUST seguir a identidade cyberpunk: tema escuro, cores neon
(cyan `#00f0ff`, magenta `#ff2d95`, amarelo `#f5d02f`, verde `#0aff6c`,
background `#050510`) definidas exclusivamente em `@theme` no Tailwind,
tipografia Orbitron (títulos) + Share Tech Mono (corpo/terminal). Nenhum
componente MAY usar estilo padrão do framework ou cores fora da paleta.
Elementos-chave: bordas com cantos cortados, glow neon, scanlines e glitch em
transições de tela. Rationale: o visual É o produto; o app substitui o Notion
como ferramenta estilizada e gamificada.

### II. Gamificação Coerente

A camada de gamificação (nível, XP, eddies, conquistas, focus mode) MUST ter
uma fonte única de verdade: regras de recompensa centralizadas, nunca espalhadas
pelos componentes. Toda ação do usuário que gera recompensa MUST emitir
feedback visual e sonoro (Framer Motion + Howler). Nenhuma recompensa MAY ser
atribuída direto na UI sem passar pelas regras centrais (evita XP duplicado ou
perdido). Rationale: consistência das métricas é o que motiva o usuário.

### III. Dados no Supabase com Segurança

A única origem persistente de dados do usuário é o Supabase auto-hospedado no
VPS do usuário (credenciais via `.env`, anon key apenas — nunca service key).
O acesso a dados MUST passar por uma camada de repositório única
(`src/lib/`), nunca por chamadas espalhadas nos componentes. Multi-usuário com
auth (e-mail/senha); RLS em todas as tabelas, sempre filtrando por `user_id`.
Nenhuma tabela MAY ficar sem política RLS. Rationale: dado de tarefa é dado
pessoal; vazamento entre usuários é inaceitável.

### IV. Qualidade Verificável

Uma tarefa de implementação só está completa quando `tsc -b && vite build`
e o linter passam sem erros, e a feature foi verificada manualmente no
`npm run dev` contra os critérios da spec. Código com erro de tipo não deve
chegar a revisão. Rationale: com muitos efeitos visuais, é fácil corromper o
app sem type-checking estrito; qualidade é gate, não opinião.

### V. Simplicidade Incremental (YAGNI)

Cada feature começa mínima e completa, sem entidades preemptivas. Nenhuma
biblioteca nova sem justificativa no plano para o projeto. Suporte offline só
entra quando o usuário exigir. Rationale: é um app pessoal; complexidade
antecipada mata a entrega.

## Restrições Técnicas

- Stack fixa: Vite + React + TypeScript, Tailwind CSS v4, Zustand (estado de
  sessão/UI), Framer Motion (animações), Howler.js (sons),
  @supabase/supabase-js (dados/auth).
- A stack só pode ser alterada via emenda desta constituição.
- O app é web (SPA), hospedado por fim no VPS do usuário; o build de
  produção deve funcionar sem backend dev-server (requisições só ao Supabase).
- Assets do usuário (imagens, sons, fontes) vivem em pastas dedicadas
  (`public/`, `src/assets/`), nunca inline em componentes grandes.

## Fluxo de Desenvolvimento

- Toda feature nova segue Spec Kit: `/speckit.specify` → `/speckit.plan` →
  `/speckit.tasks` → `/speckit.implement` → `/speckit.converge`.
- Mudanças visuais relevantes devem incluir screenshot comparado às referências
  de `files/` antes do merge.
- Cada implementação é uma tarefa pequena e verificável; sem commits gigantes
  misturando features.

## Governance

Esta constituição supera qualquer outra prática do projeto. Emendas requerem:
documentar o motivo, incremento de versão semântico (MAJOR = remoção/redefinição
incompatível; MINOR = novo princípio; PATCH = esclarecimento) e
atualização do campo `Last Amended`. Toda PR/revisão de código deve verificar
compatibilidade com os princípios I–V. Complexidade adicional (novas libs,
novos módulos) precisa de justificativa explícita no `/speckit.plan`.

**Version**: 1.0.0 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-17
