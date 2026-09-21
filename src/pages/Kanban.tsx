import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useData } from '../stores/data'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { useToast } from '../components/Toast'
import { playSfx } from '../lib/audio'
import { completeMission } from '../lib/db'
import type { Mission, MissionStatus } from '../types'

const columns: { status: MissionStatus; label: string; accent: 'cyan' | 'yellow' | 'green' }[] = [
  { status: 'a_fazer', label: 'A FAZER', accent: 'cyan' },
  { status: 'em_andamento', label: 'EM ANDAMENTO', accent: 'yellow' },
  { status: 'concluida', label: 'CONCLUÍDAS', accent: 'green' },
]

const priorityColor = { alta: 'text-neon-magenta', media: 'text-neon-yellow', baixa: 'text-neon-cyan' } as const

export default function Kanban() {
  const { missions, loadAll, saveMission } = useData()
  const { show } = useToast()
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  function inColumn(ref: HTMLDivElement | null, x: number, y: number) {
    if (!ref) return false
    const r = ref.getBoundingClientRect()
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }

  async function handleDragEnd(
    event: MouseEvent | TouchEvent | PointerEvent,
    mission: Mission,
  ) {
    const point = 'clientX' in event ? { x: event.clientX ?? 0, y: event.clientY ?? 0 } : null
    if (!point) return
    const target = columns.find((c) => inColumn(colRefs.current[c.status], point.x, point.y))
    if (!target || target.status === mission.status) return
    playSfx('click')

    if (target.status === 'concluida') {
      const result = await completeMission(mission)
      if (result) {
        playSfx('reward')
        show('reward', `+${result.xp} XP · +${result.eddies} ₡ — ${mission.code} concluída`)
        for (const a of result.unlocked) {
          playSfx('unlock')
          show('reward', `conquista: ${a.name} (+${a.reward_xp}xp +${a.reward_eddies}₡)`)
        }
      }
    } else {
      await saveMission({ id: mission.id, status: target.status })
      show('info', `${mission.code} → ${target.label.toLowerCase()}`)
    }
    void loadAll()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => {
        const items = missions
          .filter((m) => m.status === col.status)
          .sort((a, b) => a.position - b.position)
        return (
          <div
            key={col.status}
            ref={(el) => {
              colRefs.current[col.status] = el
            }}
            className="min-h-72"
          >
            <NeonPanel title={col.label} accent={col.accent}>
              <div className="flex flex-col gap-2">
                <NeonButton variant="cyan" className="w-full text-center" onClick={() => show('info', 'nova missão → aba missões')}>
                  + nova tarefa
                </NeonButton>
                {items.map((m) => (
                  <motion.div
                    key={m.id}
                    drag
                    dragSnapToOrigin
                    onDragEnd={(e) => handleDragEnd(e, m)}
                    whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
                    className="cursor-grab border border-neon-cyan/40 bg-neon-surface2 px-3 py-2 shadow-[0_0_8px_rgba(0,240,255,0.12)]"
                  >
                    <p className="text-sm text-neon-cyan">{m.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-neon-dim">
                      <span className={priorityColor[m.priority]}>{m.priority}</span> · diff {m.difficulty}/5
                      {m.due_date ? ` · ${m.due_date}` : ''}
                    </p>
                    {m.checklist.length > 0 && (
                      <p className="mt-1 text-[10px] text-neon-green">
                        checklist {m.checklist.filter((c) => c.done).length}/{m.checklist.length}
                      </p>
                    )}
                  </motion.div>
                ))}
                {items.length === 0 && (
                  <p className="text-center font-display text-[10px] uppercase tracking-[0.3em] text-neon-dim">
                    // vazio — arraste cartas aqui
                  </p>
                )}
              </div>
            </NeonPanel>
          </div>
        )
      })}
    </div>
  )
}
