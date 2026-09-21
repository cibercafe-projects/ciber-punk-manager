import { useEffect, useState, type FormEvent } from 'react'
import { useData } from '../stores/data'
import { useSession } from '../stores/session'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { useToast } from '../components/Toast'
import { playSfx } from '../lib/audio'
import { completeMission } from '../lib/db'
import { missionReward } from '../lib/rewards'
import type { ChecklistItem, Mission, Priority } from '../types'

const inputClass =
  'rounded-sm border border-neon-cyan/40 bg-neon-surface2 px-3 py-2 font-mono text-sm text-neon-cyan outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]'

const emptyForm = {
  title: '',
  project_id: '',
  description: '',
  priority: 'media' as Priority,
  difficulty: 2,
  due_date: '',
  tags: '',
  checklistText: '',
}

type Draft = Mission | null

interface MissionsProps {
  defaultProjectId?: string
}

export default function Missions({ defaultProjectId }: MissionsProps) {
  const { projects, missions, loadAll, saveMission } = useData()
  const profile = useSession((s) => s.profile)
  const { show } = useToast()
  const [draft, setDraft] = useState<Draft>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const open = missions.filter((m) => m.status !== 'concluida')
  const completed = missions.filter((m) => m.status === 'concluida')
  const byProject = new Map(projects.map((p) => [p.id, p.title]))

  function openNew() {
    setDraft(null)
    setForm({ ...emptyForm, project_id: defaultProjectId ?? projects[0]?.id ?? '' })
  }

  function openEdit(m: Mission) {
    setDraft(m)
    setForm({
      title: m.title,
      project_id: m.project_id,
      description: m.description,
      priority: m.priority,
      difficulty: m.difficulty,
      due_date: m.due_date ?? '',
      tags: m.tags.join(', '),
      checklistText: m.checklist.map((c) => c.text).join('\n'),
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.project_id) return
    playSfx('click')
    const checklist: ChecklistItem[] = form.checklistText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8)
      .map((t) => ({ text: t, done: false }))
    const payload: Partial<Mission> = {
      ...(draft ? { id: draft.id } : {}),
      project_id: form.project_id,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      difficulty: form.difficulty,
      due_date: form.due_date || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      checklist,
      status: draft?.status ?? 'a_fazer',
      ...(draft ? {} : { focus_seconds: 0, completed_at: null }),
    }
    if (!draft) {
      const mine = missions.filter((m) => m.project_id === form.project_id)
      payload.position = mine.reduce((acc, m) => Math.max(acc, m.position), 0) + 1
      payload.user_id = profile?.id
    }
    await saveMission(payload)
    show('success', draft ? 'Missão atualizada' : 'Missão criada')
    setDraft(null)
    setForm(emptyForm)
  }

  async function handleComplete(m: Mission) {
    playSfx('click')
    const result = await completeMission(m)
    if (result) {
      playSfx('reward')
      show('reward', `+${result.xp} XP · +${result.eddies} ₡ — ${m.code} concluída`)
      for (const a of result.unlocked) {
        playSfx('unlock')
        show('reward', `conquista: ${a.name} (+${a.reward_xp}xp +${a.reward_eddies}₡)`)
      }
      void loadAll()
    }
  }

  async function toggleChecklist(m: Mission, idx: number) {
    const checklist = m.checklist.map((c, i) => (i === idx ? { ...c, done: !c.done } : c))
    await saveMission({ id: m.id, checklist })
  }

  const priorityColor: Record<Priority, 'magenta' | 'yellow' | 'cyan'> = {
    alta: 'magenta',
    media: 'yellow',
    baixa: 'cyan',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <NeonButton variant="green" onClick={openNew}>
          + nova missão
        </NeonButton>
      </div>

      {draft === null && (
        <NeonPanel title="// nova missão">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <select
              required
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className={inputClass}
            >
              <option value="">projeto *</option>
              {projects
                .filter((p) => p.status === 'ativo')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
            <input
              placeholder="título *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className={inputClass}
            >
              <option value="alta">prioridade alta</option>
              <option value="media">prioridade média</option>
              <option value="baixa">prioridade baixa</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-neon-dim">
              dificuldade {form.difficulty}
              <input
                type="range"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                className="accent-neon-magenta"
              />
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="tags (vírgula)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="descrição"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} sm:col-span-2 lg:col-span-4`}
            />
            <input
              placeholder="checklist (1 item por linha, máx 8)"
              value={form.checklistText}
              onChange={(e) => setForm({ ...form, checklistText: e.target.value })}
              className={`${inputClass} sm:col-span-2 lg:col-span-6`}
            />
            <NeonButton type="submit" variant="green" disabled={!form.title.trim() || !form.project_id}>
              criar (+{missionReward(form.priority, form.difficulty).xp}xp +{missionReward(form.priority, form.difficulty).eddies}₡)
            </NeonButton>
          </form>
        </NeonPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[...open, ...completed].map((m) => {
          const { xp, eddies } = missionReward(m.priority, m.difficulty)
          const doneItems = m.checklist.filter((c) => c.done).length
          return (
            <NeonPanel
              key={m.id}
              title={`${m.code} · ${byProject.get(m.project_id) ?? 'sem projeto'}`}
              accent={m.status === 'concluida' ? 'green' : priorityColor[m.priority]}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={m.status === 'concluida' ? 'text-sm text-neon-dim line-through' : 'text-sm text-neon-cyan'}>
                  {m.title}
                </p>
                <span className="shrink-0 border border-neon-cyan/40 px-1.5 py-0.5 text-[10px] text-neon-yellow">
                  diff {m.difficulty}/5
                </span>
              </div>
              {m.description && <p className="mt-1 text-xs text-neon-dim">{m.description}</p>}
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-neon-dim">
                <span className="uppercase">{m.priority}</span>
                {m.due_date && <span>prazo {m.due_date}</span>}
                <span>
                  recompensa {xp}xp · {eddies}₡
                </span>
              </div>
              {m.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.tags.map((t) => (
                    <span key={t} className="border border-neon-magenta/40 px-1.5 py-0.5 text-[10px] text-neon-magenta">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {m.checklist.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-widest text-neon-dim">
                    checklist {doneItems}/{m.checklist.length}
                  </p>
                  {m.checklist.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => toggleChecklist(m, i)}
                      className={`flex items-center gap-2 text-left text-xs transition-colors ${
                        c.done ? 'text-neon-green' : 'text-neon-dim hover:text-neon-cyan'
                      }`}
                    >
                      <span className={`h-3 w-3 shrink-0 border ${c.done ? 'border-neon-green bg-neon-green/30' : 'border-neon-cyan/50'}`} />
                      <span className={c.done ? 'line-through' : ''}>{c.text}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.status !== 'concluida' ? (
                  <>
                    {m.status !== 'em_andamento' && (
                      <NeonButton variant="yellow" className="px-2 py-1" onClick={() => saveMission({ id: m.id, status: 'em_andamento' })}>
                        iniciar
                      </NeonButton>
                    )}
                    <NeonButton variant="green" className="px-2 py-1" onClick={() => handleComplete(m)}>
                      completar
                    </NeonButton>
                    <NeonButton variant="cyan" className="px-2 py-1" onClick={() => openEdit(m)}>
                      editar
                    </NeonButton>
                  </>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-neon-green">
                    concluída {m.completed_at?.slice(0, 10) ?? ''}
                  </span>
                )}
              </div>
            </NeonPanel>
          )
        })}
        {missions.length === 0 && (
          <p className="font-display text-xs uppercase tracking-[0.3em] text-neon-dim">// nenhuma missão registrada</p>
        )}
      </div>

      {draft && (
        <NeonPanel title={`// editar: ${draft.code}`} accent="magenta" className="lg:col-span-2 xl:col-span-3">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <select
              required
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className={inputClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <input
              placeholder="título *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className={inputClass}
            >
              <option value="alta">prioridade alta (1.5x)</option>
              <option value="media">prioridade média (1.2x)</option>
              <option value="baixa">prioridade baixa (1.0x)</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-neon-dim">
              dificuldade {form.difficulty}
              <input
                type="range"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                className="accent-neon-magenta"
              />
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={inputClass}
            />
            <div className="flex gap-2">
              <NeonButton type="submit" variant="green">
                salvar
              </NeonButton>
              <NeonButton type="button" variant="red" onClick={() => setDraft(null)}>
                cancelar
              </NeonButton>
            </div>
            <input
              placeholder="descrição"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} sm:col-span-2 lg:col-span-4`}
            />
            <input
              placeholder="tags (vírgula)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className={inputClass}
            />
          </form>
        </NeonPanel>
      )}
    </div>
  )
}
