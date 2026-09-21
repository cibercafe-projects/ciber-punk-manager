import { useEffect, useMemo, useState } from 'react'
import { useData } from '../stores/data'
import { useSession } from '../stores/session'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { Progress } from '../components/ProgressBar'
import { GlitchText } from '../components/GlitchText'
import { listAchievements, listUserAchievements } from '../lib/db'
import { achievementProgress } from '../lib/rewards'
import type { Achievement, UserAchievement } from '../types'

const rarityAccent: Record<string, 'cyan' | 'green' | 'magenta' | 'yellow'> = {
  comum: 'cyan',
  rara: 'green',
  épicas: 'magenta',
  especiais: 'magenta',
  lendária: 'yellow',
}

type Filter = 'todas' | 'desbloqueadas' | 'bloqueadas'

export default function Achievements() {
  const { missions, projects, loadAll } = useData()
  const profile = useSession((s) => s.profile)
  const [achs, setAchs] = useState<Achievement[]>([])
  const [unlocks, setUnlocks] = useState<UserAchievement[]>([])
  const [filter, setFilter] = useState<Filter>('todas')

  useEffect(() => {
    void loadAll()
    void listAchievements().then(setAchs)
    void listUserAchievements().then(setUnlocks)
  }, [loadAll])

  const ctx = useMemo(
    () => ({
      missionsCompleted: missions.filter((m) => m.status === 'concluida').length,
      projectsDone: projects.filter((p) => p.status === 'concluido').length,
      focusMinutes: Math.round(
        missions.reduce((acc, m) => acc + m.focus_seconds, 0) / 60,
      ),
      missionsOntime: missions.filter(
        (m) =>
          m.status === 'concluida' &&
          (!m.due_date || (m.completed_at?.slice(0, 10) ?? '') <= m.due_date),
      ).length,
      missionsLate: missions.filter(
        (m) => m.status === 'concluida' && m.due_date && (m.completed_at?.slice(0, 10) ?? '') > m.due_date,
      ).length,
      streak: profile?.streak_days ?? 0,
      xp: profile?.xp ?? 0,
    }),
    [missions, projects, profile],
  )

  const shown = achs.filter((a) => {
    const u = unlocks.find((u) => u.achievement_id === a.id)
    if (filter === 'desbloqueadas') return !!u?.unlocked_at
    if (filter === 'bloqueadas') return !u?.unlocked_at
    return true
  })

  const unlockedCount = unlocks.filter((u) => u.unlocked_at).length

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl tracking-[0.2em] text-neon-yellow">
        <GlitchText>{`CONQUISTAS ${unlockedCount}/${achs.length}`}</GlitchText>
      </h1>
      <div className="flex flex-wrap gap-2">
        {(['todas', 'desbloqueadas', 'bloqueadas'] as Filter[]).map((f) => (
          <NeonButton
            key={f}
            variant={filter === f ? 'magenta' : 'cyan'}
            className="px-3 py-1"
            onClick={() => setFilter(f)}
          >
            {f}
          </NeonButton>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((a) => {
          const u = unlocks.find((u) => u.achievement_id === a.id)
          const unlocked = !!u?.unlocked_at
          const local = achievementProgress(a.criterion, ctx)
          const progress = Math.max(u?.progress ?? 0, local)
          return (
            <NeonPanel
              key={a.id}
              title={unlocked ? a.name : '???'}
              accent={rarityAccent[a.rarity] ?? 'cyan'}
              className={unlocked ? '' : 'opacity-70'}
            >
              <p className="text-xs text-neon-dim">{a.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-neon-cyan">
                critério: {a.criterion.type.replace('_', ' ')} {progress}/{a.criterion.target}
                {unlocked && ' ✓'}
              </p>
              <Progress value={progress} max={a.criterion.target} color={unlocked ? 'green' : 'cyan'} className="mt-1" />
              <p className="mt-2 text-[10px] uppercase tracking-widest text-neon-magenta">
                +{a.reward_xp}xp +{a.reward_eddies}₡ · {a.rarity}
              </p>
              {u?.unlocked_at && (
                <p className="mt-1 text-[10px] text-neon-green">desbloqueada em {u.unlocked_at.slice(0, 10)}</p>
              )}
            </NeonPanel>
          )
        })}
        {achs.length === 0 && (
          <p className="font-display text-xs uppercase tracking-[0.3em] text-neon-dim">
            // seed de conquistas não aplicado — rode 002 no SQL editor
          </p>
        )}
      </div>
    </div>
  )
}
