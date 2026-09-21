import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../stores/session'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { GlitchText } from '../components/GlitchText'
import { playSfx } from '../lib/audio'

export default function Login() {
  const navigate = useNavigate()
  const setUser = useSession((s) => s.setUser)
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    playSfx('click')
    const { data, error: err } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (err) {
      setError(err.message)
      playSfx('error')
      return
    }
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email ?? '' })
      navigate('/', { replace: true })
    } else {
      setError('Cadastro criado — confirme o e-mail antes de entrar.')
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-4">
      <h1 className="font-display text-3xl tracking-[0.3em] text-neon-cyan [text-shadow:0_0_14px_rgba(0,240,255,0.6)] sm:text-4xl">
        <GlitchText>NEON//TASK SYSTEM</GlitchText>
      </h1>
      <NeonPanel title={mode === 'signIn' ? '// ACESSO' : '// NOVO RUNNER'} className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-neon-dim">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border border-neon-cyan/40 bg-neon-surface2 px-3 py-2 font-mono text-sm text-neon-cyan outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-neon-dim">
            Senha
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border border-neon-cyan/40 bg-neon-surface2 px-3 py-2 font-mono text-sm text-neon-cyan outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            />
          </label>
          {error && <p className="text-neon-red">// {error}</p>}
          <NeonButton type="submit" variant="magenta" disabled={busy}>
            {busy ? 'conectando…' : mode === 'signIn' ? 'entrar' : 'registrar'}
          </NeonButton>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn')
              setError(null)
            }}
            className="text-[10px] uppercase tracking-widest text-neon-dim hover:text-neon-cyan"
          >
            {mode === 'signIn' ? 'novo runner? criar conta' : 'já tem conta? entrar'}
          </button>
        </form>
      </NeonPanel>
      <p className="text-[10px] uppercase tracking-[0.3em] text-neon-dim">night city // rede privada</p>
    </main>
  )
}
