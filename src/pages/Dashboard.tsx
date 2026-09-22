import { useEffect, useMemo } from 'react'
import { useData } from '../stores/data'
import { useSession } from '../stores/session'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { StatCard } from '../components/StatCard'
import { useToast } from '../components/Toast'
import { Progress } from '../components/ProgressBar'
import { GlitchText } from '../components/GlitchText'
import { playSfx } from '../lib/audio'
import { completeMission } from '../lib/db'
import { missionReward, xpProgress } from '../lib/rewards'
import { notifyRewards, detectLevelUp } from '../lib/feedback'
import type { Mission } from '../types'

const PRIORITY_WEIGHT = { alta: 3, media: 2, baixa: 1 } as const

function nextMission(missions: Mission[]): Mission | null {
  const open = missions.filter((m) => m.status !== 'concluida')
  if (open.length === 0) return null
  return [...open].sort((a, b) => {
    const pw = PRIORITY_WEIGHT[a.priority] * 2 + a.difficulty - PRIORITY_WEIGHT[b.priority] * 2 - b.difficulty
    if (pw !== 0) return -pw
    return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
  })[0]
}

export default function Dashboard() {
  const { projects, missions, loadAll, saveMission } = useData()
  const profile = useSession((s) => s.profile)
  const { show } = useToast()

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const stats = useMemo(() => {
    const completed = missions.filter((m) => m.status === 'concluida')
    const active = missions.filter((m) => m.status !== 'concluida')
    const emAndamento = missions.filter((m) => m.status === 'em_andamento')
    const focusMin = Math.round(missions.reduce((acc, m) => acc + m.focus_seconds, 0) / 60)
    const today = new Date().toISOString().slice(0, 10)
    const dueToday = active.filter((m) => m.due_date === today)
    return { completed, active, emAndamento, focusMin, dueToday }
  }, [missions])

  const weekly = useMemo(() => {
    const days: { label: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      days.push({
        label: d.slice(5),
        count: missions.filter((m) => m.status === 'concluida' && (m.completed_at ?? '').slice(0, 10) === d).length,
      })
    }
    return days
  }, [missions])
  const maxWeekly = Math.max(1, ...weekly.map((d) => d.count))

  const next = nextMission(missions)
  const prog = xpProgress(profile?.xp ?? 0)

  async function handleStart(m: Mission) {
    playSfx('click')
    await saveMission({ id: m.id, status: 'em_andamento' })
    show('info', `${m.code} em andamento`)
  }

  async function handleComplete(m: Mission) {
    playSfx('click')
    const xpBefore = profile?.xp ?? 0
    const result = await completeMission(m)
    if (result) {
      notifyRewards(show, `${m.code} concluída`, result)
      if (detectLevelUp(xpBefore, result)) playSfx('levelUp')
      void loadAll()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl tracking-[0.2em] text-neon-cyan">
        <GlitchText>DASHBOARD</GlitchText>
      </h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="missões ativas" value={stats.active.length} color="cyan" />
        <StatCard label="em andamento" value={stats.emAndamento.length} color="yellow" hint={`${stats.dueToday.length} vencem hoje`} />
        <StatCard label="concluídas" value={stats.completed.length} color="green" />
        <StatCard label="foco total" value={`${stats.focusMin}m`} color="magenta" />
        <StatCard label="projetos ativos" value={projects.filter((p) => p.status === 'ativo').length} color="cyan" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <NeonPanel title="// produtividade (7 dias)" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-3 px-2">
            {weekly.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-neon-dim">{d.count}</span>
                <div
                  className="w-full bg-neon-magenta shadow-[0_0_10px_rgba(255,45,149,0.5)] transition-all"
                  style={{ height: `${(d.count / maxWeekly) * 100}%`, minHeight: d.count ? 4 : 1 }}
                />
                <span className="text-[10px] text-neon-dim">{d.label}</span>
              </div>
            ))}
          </div>
        </NeonPanel>

        <NeonPanel title="// progresso" accent="yellow">
          <div className="flex flex-col gap-2">
            <p className="font-display text-3xl text-neon-yellow">lv.{prog.level}</p>
            <Progress value={prog.total - prog.remaining} max={prog.total} color="yellow" />
            <p className="text-xs text-neon-dim">
              faltam <span className="text-neon-cyan">{prog.remaining}xp</span> para lv.{prog.level + 1}
            </p>
            <p className="text-xs text-neon-dim">
              eddies: <span className="text-neon-magenta">₡{profile?.eddies ?? 0}</span> · streak:{' '}
              <span className="text-neon-green">{profile?.streak_days ?? 0}d</span>
            </p>
          </div>
        </NeonPanel>

        <NeonPanel title="// próxima missão" accent="magenta" className="lg:col-span-3">
          {next ? (() => {
            const { xp, eddies } = missionReward(next.priority, next.difficulty)
            return (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-48">
                  <p className="text-sm text-neon-cyan">
                    {next.code} · {next.title}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-neon-dim">
                    {next.priority} · diff {next.difficulty}/5 · recompensa {xp}xp +{eddies}₡
                    {next.due_date ? ` · prazo ${next.due_date}` : ''}
                  </p>
                </div>
                {next.status !== 'em_andamento' && (
                  <NeonButton variant="yellow" onClick={() => handleStart(next)}>
                    iniciar missão
                  </NeonButton>
                )}
                <NeonButton variant="green" onClick={() => handleComplete(next)}>
                  completar
                </NeonButton>
              </div>
            )
          })() : (
            <p className="font-display text-xs uppercase tracking-[0.3em] text-neon-dim">
              // nenhuma missão ativa — crie uma em missões
            </p>
          )}
        </NeonPanel>
      </div>
    </div>
  )
}
