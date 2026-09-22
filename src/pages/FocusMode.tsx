import { useEffect, useRef, useState } from 'react'
import { useData } from '../stores/data'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { useToast } from '../components/Toast'
import { Progress } from '../components/ProgressBar'
import { GlitchText } from '../components/GlitchText'
import { playSfx } from '../lib/audio'
import { addFocusSeconds, completeMission } from '../lib/db'
import { notifyRewards, detectLevelUp } from '../lib/feedback'
import { useSession } from '../stores/session'
import type { Mission } from '../types'

const HEARTBEAT_SECONDS = 30

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusMode() {
  const { missions, loadAll, saveMission } = useData()
  const { show } = useToast()
  const [missionId, setMissionId] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const syncRef = useRef(0)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const mission = missions.find((m) => m.id === missionId) ?? null

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next % 1500 === 0) playSfx('recharge')
        return next
      })
      syncRef.current += 1
      if (syncRef.current >= HEARTBEAT_SECONDS) {
        const mission = missions.find((m) => m.id === missionId)
        const secs = syncRef.current
        syncRef.current = 0
        if (mission) void addFocusSeconds(mission, secs)
      }
    }, 1000)
    return () => window.clearInterval(t)
  }, [running, missionId, missions])

  function pick(m: Mission) {
    if (running) return
    setMissionId(m.id)
    setElapsed(0)
    syncRef.current = 0
    playSfx('click')
  }

  async function togglePause() {
    playSfx('click')
    if (running && syncRef.current > 0 && mission) {
      const secs = syncRef.current
      syncRef.current = 0
      await addFocusSeconds(mission, secs)
    }
    setRunning(!running)
  }

  async function finish(complete: boolean) {
    setRunning(false)
    playSfx('click')
    if (syncRef.current > 0 && mission) {
      const secs = syncRef.current
      syncRef.current = 0
      await addFocusSeconds(mission, secs)
    }
    if (complete && mission) {
      const xpBefore = useSession.getState().profile?.xp ?? 0
      const result = await completeMission(mission)
      if (result) {
        notifyRewards(show, `${mission.code} concluída`, result)
        if (detectLevelUp(xpBefore, result)) playSfx('levelUp')
      }
    }
    setElapsed(0)
    setMissionId('')
    void loadAll()
  }

  async function abort() {
    setRunning(false)
    playSfx('click')
    syncRef.current = 0
    if (mission) await saveMission({ id: mission.id, status: 'a_fazer' })
    setElapsed(0)
    setMissionId('')
    void loadAll()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl tracking-[0.2em] text-neon-magenta">
        <GlitchText>FOCUS MODE</GlitchText>
      </h1>

      {!mission && (
        <NeonPanel title="// seleção de alvo">
          <div className="flex flex-col gap-2">
            {missions
              .filter((m) => m.status !== 'concluida')
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => pick(m)}
                  className="flex items-center justify-between border border-neon-cyan/30 bg-neon-surface2 px-3 py-2 text-left text-sm text-neon-cyan transition-colors hover:border-neon-magenta/60 hover:shadow-[0_0_10px_rgba(255,45,149,0.25)]"
                >
                  <span>
                    {m.code} · {m.title}
                  </span>
                  <span className="text-[10px] uppercase text-neon-dim">
                    {m.status === 'em_andamento' ? 'retomar' : 'selecionar'} · foco {fmt(m.focus_seconds)}
                  </span>
                </button>
              ))}
            {missions.filter((m) => m.status !== 'concluida').length === 0 && (
              <p className="font-display text-xs uppercase tracking-[0.3em] text-neon-dim">
                // nenhuma missão ativa
              </p>
            )}
          </div>
        </NeonPanel>
      )}

      {mission && (
        <NeonPanel title={`// foco: ${mission.code}`} accent="magenta">
          <p className="text-sm text-neon-cyan">{mission.title}</p>
          <p className="mt-6 text-center font-display text-6xl text-neon-cyan [text-shadow:0_0_20px_rgba(0,240,255,0.6)]">
            {fmt(elapsed)}
          </p>
          <div className="mx-auto mt-4 max-w-sm">
            <Progress value={elapsed % 1500} max={1500} color="magenta" />
            <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-neon-dim">
              bloco 25min · heartbeat {HEARTBEAT_SECONDS}s
            </p>
          </div>
          {running && (
            <p className="mt-2 text-center font-display text-[10px] uppercase tracking-[0.4em] text-neon-green animate-[flicker_1.5s_infinite]">
              ▶ registrando foco…
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <NeonButton variant={running ? 'yellow' : 'green'} onClick={togglePause}>
              {running ? 'pausar' : 'retomar'}
            </NeonButton>
            <NeonButton variant="green" onClick={() => finish(true)}>
              concluir missão
            </NeonButton>
            <NeonButton variant="red" onClick={abort}>
              abortar
            </NeonButton>
          </div>
        </NeonPanel>
      )}
    </div>
  )
}
