import { NavLink, Outlet } from 'react-router-dom'
import { useOffline } from './stores/offline'
import { useSession } from './stores/session'
import { useUi } from './stores/ui'
import { xpProgress } from './lib/rewards'
import { Progress } from './components/ProgressBar'
import { GlitchText } from './components/GlitchText'
import heroImg from './assets/hero.png'

const routes = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projetos', label: 'Projetos' },
  { to: '/missoes', label: 'Missões' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/focus', label: 'Focus' },
  { to: '/conquistas', label: 'Conquistas' },
  { to: '/album', label: 'Álbum' },
  { to: '/terminal', label: 'Terminal' },
  { to: '/config', label: 'Config' },
]

interface LayoutProps {
  onSignOut: () => void
}

export function Layout({ onSignOut }: LayoutProps) {
  const pending = useOffline((s) => s.queue.length)
  const online = useOffline((s) => s.online)
  const profile = useSession((s) => s.profile)
  const bg = useUi((s) => s)
  const backdrop = bg.backgroundKind === 'solid' ? '' : bg.backgroundKind === 'random' ? heroImg : bg.backgroundUrl
  const { level, remaining, total } = xpProgress(profile?.xp ?? 0)

  return (
    <div className="relative flex min-h-svh">
      {backdrop && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdrop})`, opacity: bg.backgroundOpacity }}
        />
      )}
      <aside className="z-10 flex w-52 shrink-0 flex-col border-r border-neon-cyan/25 bg-neon-surface/70 px-3 py-4">
        <a href="#" className="mb-6 px-2 font-display text-sm tracking-widest text-neon-magenta [text-shadow:0_0_10px_rgba(255,45,149,0.5)]">
          <GlitchText>NEON//TASK</GlitchText>
        </a>
        <nav className="flex flex-1 flex-col gap-1">
          {routes.map((r) => (
            <NavLink
              key={r.to}
              to={r.to}
              end={r.end}
              className={({ isActive }) =>
                `rounded-sm border border-transparent px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-neon-dim hover:border-neon-cyan/30 hover:text-neon-cyan'
                }`
              }
            >
              {r.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={onSignOut}
          className="mt-4 px-3 py-2 text-left font-display text-[10px] uppercase tracking-[0.2em] text-neon-dim hover:text-neon-red"
        >
          // desconectar
        </button>
      </aside>

      <div className="z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-neon-cyan/25 bg-neon-surface/50 px-4 py-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm uppercase tracking-widest text-neon-cyan">
                {profile?.handle ?? 'runner'} · lv.{level}
              </span>
              <span className="font-display text-[10px] uppercase tracking-widest text-neon-magenta">
                ₡{profile?.eddies ?? 0} eddies
              </span>
            </div>
            <Progress value={total - remaining} max={total} color="yellow" />
          </div>
          {!online && (
            <span className="ml-auto animate-[flicker_2s_infinite] border border-neon-yellow/60 px-3 py-1 font-display text-[10px] uppercase tracking-widest text-neon-yellow">
              offline // {pending} ops pendentes
            </span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
