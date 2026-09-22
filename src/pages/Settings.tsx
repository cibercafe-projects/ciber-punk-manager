import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUi } from '../stores/ui'
import { useSession } from '../stores/session'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { GlitchText } from '../components/GlitchText'
import heroImg from '../assets/hero.png'
import { applyVolume } from '../lib/audio'
import { saveProfile } from '../lib/db'
import type { BackgroundKind } from '../stores/ui'

const backdropUrl = (kind: BackgroundKind, url: string) => (kind === 'random' ? heroImg : url)

export default function Settings() {
  const ui = useUi()
  const navigate = useNavigate()
  const profile = useSession((s) => s.profile)
  const loadProfile = useSession((s) => s.loadProfile)
  const sessionUser = useSession((s) => s.user)
  const [handle, setHandle] = useState(profile?.handle ?? '')

  async function toggleSound() {
    ui.toggleSound()
    applyVolume()
  }

  async function onVolume(v: number) {
    ui.setVolume(v)
    applyVolume()
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    ui.setBackground('image', url, ui.backgroundOpacity)
  }

  async function saveHandle() {
    if (!handle.trim() || !profile?.id) return
    await saveProfile({ id: profile.id, handle: handle.trim() })
    await loadProfile()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl tracking-[0.2em] text-neon-cyan">
        <GlitchText>CONFIG</GlitchText>
      </h1>

      <NeonPanel title="// visual">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['solid', 'image', 'random'] as BackgroundKind[]).map((k) => (
              <NeonButton
                key={k}
                variant={ui.backgroundKind === k ? 'magenta' : 'cyan'}
                className="px-3 py-1"
                onClick={() => ui.setBackground(k)}
              >
                {k === 'solid' ? 'neon sólido' : k === 'image' ? 'imagem' : 'aleatório'}
              </NeonButton>
            ))}
            {ui.backgroundKind === 'image' && (
              <label className="cursor-pointer border border-neon-cyan/60 px-3 py-1 text-xs text-neon-cyan hover:bg-neon-cyan/10">
                carregar imagem…
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
            )}
            {backdropUrl(ui.backgroundKind, ui.backgroundUrl) && (
              <span className="text-[10px] text-neon-dim">
                preview ativo: {ui.backgroundKind === 'random' ? 'hero padrão' : 'sua imagem'}
              </span>
            )}
          </div>
          <label className="flex items-center gap-3 text-xs text-neon-dim">
            opacidade do bg: {Math.round(ui.backgroundOpacity * 100)}%
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={ui.backgroundOpacity}
              onChange={(e) => ui.setBackground(ui.backgroundKind, ui.backgroundUrl, Number(e.target.value))}
              className="accent-neon-magenta"
            />
          </label>
        </div>
      </NeonPanel>

      <NeonPanel title="// áudio e sons">
        <div className="flex flex-col gap-3">
          <NeonButton variant={ui.soundOn ? 'green' : 'red'} className="w-40" onClick={() => void toggleSound()}>
            {ui.soundOn ? 'sons: ON' : 'sons: OFF'}
          </NeonButton>
          <label className="flex items-center gap-3 text-xs text-neon-dim">
            volume: {Math.round(ui.volume * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ui.volume}
              onChange={(e) => void onVolume(Number(e.target.value))}
              className="accent-neon-cyan"
            />
          </label>
          <p className="text-[10px] text-neon-dim">
            coloque seus arquivos em public/sfx (click, reward, unlock, error) e ligue o som aqui
          </p>
        </div>
      </NeonPanel>

      <NeonPanel title="// conta">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-1 flex-col gap-1 text-xs uppercase tracking-widest text-neon-dim">
            handle
            <div className="flex gap-2">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="rounded-sm border border-neon-cyan/40 bg-neon-surface2 px-3 py-2 font-mono text-sm text-neon-cyan outline-none focus:border-neon-cyan"
              />
              <NeonButton variant="green" onClick={() => void saveHandle()}>
                salvar
              </NeonButton>
            </div>
          </label>
          <p className="text-[10px] text-neon-dim">e-mail: {sessionUser?.email ?? '—'}</p>
          <NeonButton
            variant="red"
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/login')
            }}
          >
            desconectar
          </NeonButton>
        </div>
      </NeonPanel>
    </div>
  )
}
