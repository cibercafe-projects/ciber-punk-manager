# Quickstart — 001-neon-task-core

## Dev local

```powershell
npm install
npm run dev      # http://localhost:5173
npm run build    # gate: tsc -b && vite build
npm run lint     # oxlint
```

## Supabase (VPS)

1. No painel do Supabase self-hosted: criar projeto, pegar URL + anon key (nunca service key).
2. Aplicar `supabase/migrations/001_init.sql` (SQL Editor) — tabelas, RLS, trigger de perfil, seed de conquistas.
3. Habilitar email+password no Auth (self-hosted: já habilitado; primeira conta criada pela tela de login).
4. Atualizar `.env`:

```ini
VITE_SUPABASE_URL=https://<seu-vps>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Deploy da SPA no VPS

```powershell
npm run build          # gera dist/
# copiar dist/ para o nginx/servidor do VPS; SPA fallback para index.html
```

## Verificação por story (gate manual)

- Login: credenciais erradas → erro neon; corretas → dashboard.
- Recompensa: concluir MISSÃO alta/dif 5 → +150 xp (20×5×1.5) e +50 eddies, uma única vez.
- Offline: derrubar rede → banner; criar missão offline → reconectar → sync aplica no banco.
- Focus: timer acumula, persiste após refresh.
