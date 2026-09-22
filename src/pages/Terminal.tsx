import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../stores/data'
import { useSession } from '../stores/session'
import { playSfx } from '../lib/audio'
import { completeMission, addFocusSeconds, checkAchievements } from '../lib/db'
import { xpProgress } from '../lib/rewards'
import { notifyRewards, detectLevelUp } from '../lib/feedback'
import type { Mission } from '../types'

type Line = { text: string; kind: 'in' | 'out' | 'err' | 'hl' }

const HELP = [
  'help                        — esta lista',
  'projects                    — lista projetos',
  'missions [status]           — missões (filtro: a_fazer/em_andamento/concluida)',
  'create "<título>"           — nova missão no primeiro projeto ativo',
  'complete <código|id>        — conclui missão (recompensas)',
  'focus <código|id> <min>     — registra tempo de foco',
  'stats                       — resumo do runner',
  'achievements                — recalcula/desbloqueia conquistas',
  'exit                        — volta ao dashboard',
]

function pickMission(q: string, missions: Mission[]): Mission | null {
  const lower = q.toLowerCase()
  return missions.find((m) => m.id === q) ?? missions.find((m) => m.code.toLowerCase() === lower) ?? null
}

const lineColor = { in: 'text-neon-magenta', out: 'text-neon-green', err: 'text-neon-red', hl: 'text-neon-yellow' } as const

export default function Terminal() {
  const navigate = useNavigate()
  const { projects, missions, loadAll, saveMission, saveProject } = useData()
  const profile = useSession((s) => s.profile)
  const [lines, setLines] = useState<Line[]>([
    { text: 'NT://TERMINAL v1.0 — digite "help" para comandos', kind: 'out' },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadAll()
  }, [loadAll])
  useEffect(() => {
    playSfx('hacks')
  }, [])
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  function out(text: string, kind: Line['kind'] = 'out') {
    setLines((l) => [...l.slice(-200), { text, kind }])
  }

  async function run(raw: string) {
    const [cmd, ...rest] = raw.trim().split(/\s+/)
    playSfx('click')
    switch (cmd) {
      case 'help':
        HELP.forEach((h) => out(h))
        break
      case 'projects':
        projects.forEach((p) => {
          out(`[${p.status}] ${p.id.slice(0, 8)}… ${p.title}${p.due_date ? ` · prazo ${p.due_date}` : ''}`)
        })
        out(`${projects.length} projeto(s)`)
        break
      case 'archive': {
        const p = projects.find((x) => (rest[0] && x.id.startsWith(rest[0])) || x.id === rest[0])
        if (!p) {
          out('uso: archive <id> — copie a id de "projects"', 'err')
          return
        }
        await saveProject({ id: p.id, status: 'arquivado' })
        out(`projeto "${p.title}" arquivado`)
        break
      }
      case 'missions': {
        const f = rest[0]?.toLowerCase()
        const selected = f ? missions.filter((m) => m.status === f) : missions
        selected.forEach((m) => {
          out(`[${m.status}] ${m.code} · ${m.title} · ${m.priority} · diff ${m.difficulty}${m.due_date ? ` · ${m.due_date}` : ''}`)
        })
        out(`${selected.length} missão(ões)`)
        break
      }
      case 'create': {
        const quoted = raw.match(/"([^"]+)"/)?.[1]?.trim()
        if (!quoted) {
          out('create exige "título" entre aspas', 'err')
          return
        }
        const project = projects.find((p) => p.id === rest.filter((r) => !r.startsWith('"'))[0]) ?? projects.find((p) => p.status === 'ativo')
        if (!project) {
          out('nenhum projeto ativo — crie um em projetos', 'err')
          return
        }
        const seq = missions.filter((m) => m.project_id === project.id).length + 1
        const code = `${project.title.slice(0, 2).toUpperCase()}-M${seq}`
        await saveMission({
          project_id: project.id,
          title: quoted,
          description: '',
          priority: 'media',
          difficulty: 2,
          due_date: null,
          tags: [],
          checklist: [],
          status: 'a_fazer',
          focus_seconds: 0,
          completed_at: null,
          position: missions.reduce((acc, x) => Math.max(acc, x.position), 0) + 1,
          code,
        })
        out(`missão ${code} criada → ${project.title}`)
        break
      }
      case 'complete': {
        const m = pickMission(rest[0] ?? '', missions)
        if (!m) {
          out('missão não encontrada — use "missions" para listar', 'err')
          return
        }
        const xpBefore = profile?.xp ?? 0
        const result = await completeMission(m)
        void loadAll()
        if (result) {
          notifyRewards((k, msg) => out(msg, k === 'reward' ? 'hl' : 'out'), `${m.code} concluída`, result)
          if (detectLevelUp(xpBefore, result)) out('▲ LEVEL UP — sons de nível', 'hl')
        } else {
          out(`${m.code} já estava concluída (idempotente)`, 'err')
        }
        break
      }
      case 'focus': {
        const m = pickMission(rest[0] ?? '', missions)
        const minutes = Number(rest[1])
        if (!m || !Number.isFinite(minutes) || minutes <= 0) {
          out('uso: focus <código|id> <minutos>', 'err')
          return
        }
        await addFocusSeconds(m, Math.round(minutes * 60))
        out(`+${Math.round(minutes * 60)}s de foco em ${m.code}`)
        break
      }
      case 'stats': {
        const concl = missions.filter((m) => m.status === 'concluida')
        const focusMin = Math.round(missions.reduce((acc, m) => acc + m.focus_seconds, 0) / 60)
        const prog = xpProgress(profile?.xp ?? 0)
        out(`runner: ${profile?.handle ?? '—'} · lv.${prog.level} · faltam ${prog.remaining}xp p/ lv.${prog.level + 1}`)
        out(`eddies: ₡${profile?.eddies ?? 0} · streak: ${profile?.streak_days ?? 0}d`)
        out(`projetos: ${projects.length} · missões: ${missions.length} (${concl.length} concluídas) · foco: ${focusMin}min`)
        break
      }
      case 'achievements': {
        const newly = await checkAchievements()
        void loadAll()
        if (newly.length) {
          for (const a of newly) {
            playSfx('unlock')
            out(`★ desbloqueada: ${a.name}`, 'hl')
          }
        } else {
          out('nada novo por aqui — progresso recalculado')
        }
        break
      }
      case 'exit':
        navigate('/')
        return
      case '':
        break
      default:
        out(`comando desconhecido: ${cmd} — tente "help"`, 'err')
        playSfx('error')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = input
    setInput('')
    out(`NT$ ${value}`, 'in')
    await run(value)
  }

  return (
    <div className="scanlines neon-border max-h-[70vh] overflow-y-auto rounded-sm bg-black/70 p-4 font-mono text-xs">
      {lines.map((l, i) => (
        <p key={i} className={lineColor[l.kind]}>
          {l.text}
        </p>
      ))}
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <span className="text-neon-magenta">NT$</span>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border-none bg-transparent font-mono text-neon-green outline-none"
          placeholder="help"
        />
      </form>
      <div ref={endRef} />
    </div>
  )
}
