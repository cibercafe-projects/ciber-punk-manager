import { useEffect, useState, type FormEvent } from 'react'
import { useData } from '../stores/data'
import { NeonPanel } from '../components/NeonPanel'
import { NeonButton } from '../components/NeonButton'
import { useToast } from '../components/Toast'
import { Progress } from '../components/ProgressBar'
import { playSfx } from '../lib/audio'
import type { Project, ProjectStatus } from '../types'

type Draft = Pick<Project, 'id' | 'title' | 'description' | 'client' | 'due_date' | 'tags' | 'status'> | null

const emptyDraft = {
  title: '',
  description: '',
  client: '',
  due_date: '',
  tags: '',
}

const inputClass =
  'rounded-sm border border-neon-cyan/40 bg-neon-surface2 px-3 py-2 font-mono text-sm text-neon-cyan outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]'

export default function Projects() {
  const { projects, missions, loadAll, saveProject } = useData()
  const { show } = useToast()
  const [filter, setFilter] = useState<'ativo' | 'arquivado' | 'concluido'>('ativo')
  const [draft, setDraft] = useState<Draft>(null)
  const [form, setForm] = useState(emptyDraft)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const missionOfProject = (pid: Project['id']) => missions.filter((m) => m.project_id === pid)
  const shown = projects.filter((p) => p.status === filter)

  function openNew() {
    setDraft(null)
    setForm(emptyDraft)
  }

  function openEdit(p: Project) {
    setDraft(p)
    setForm({
      title: p.title,
      description: p.description,
      client: p.client ?? '',
      due_date: p.due_date ?? '',
      tags: p.tags.join(', '),
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    playSfx('click')
    const payload: Partial<Project> = {
      ...(draft ? { id: draft.id, status: draft.status } : { status: 'ativo' as const }),
      title: form.title.trim(),
      description: form.description.trim(),
      client: form.client.trim() || null,
      due_date: form.due_date || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    if (!draft) {
      const max = projects.reduce((acc, p) => Math.max(acc, p.position), 0)
      payload.position = max + 1
    }
    await saveProject(payload)
    show('success', draft ? 'Projeto atualizado' : 'Projeto criado')
    setDraft(null)
    setForm(emptyDraft)
  }

  async function setStatus(p: Project, status: ProjectStatus) {
    playSfx('click')
    await saveProject({ id: p.id, status })
    show('info', status === 'arquivado' ? 'Projeto arquivado' : 'Projeto reativado')
    if (draft?.id === p.id) setDraft(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['ativo', 'arquivado', 'concluido'] as const).map((f) => (
          <NeonButton
            key={f}
            variant={filter === f ? 'magenta' : 'cyan'}
            onClick={() => setFilter(f)}
            className="px-3 py-1"
          >
            {f === 'concluido' ? 'concluídos' : f === 'ativo' ? 'ativos' : 'arquivados'}
          </NeonButton>
        ))}
        <NeonButton variant="green" onClick={openNew}>
          + novo projeto
        </NeonButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {draft === null && (
          <NeonPanel title="// novo projeto" className="md:col-span-2 xl:col-span-3">
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                placeholder="título *"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="cliente"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className={inputClass}
              />
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
              <NeonButton type="submit" variant="green">
                criar
              </NeonButton>
              <input
                placeholder="descrição"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputClass} sm:col-span-2 lg:col-span-4`}
              />
            </form>
          </NeonPanel>
        )}

        {shown.map((p) => {
          const ms = missionOfProject(p.id)
          const done = ms.filter((m) => m.status === 'concluida').length
          return (
            <NeonPanel
              key={p.id}
              title={p.title}
              accent={p.status === 'concluido' ? 'green' : p.status === 'arquivado' ? 'yellow' : 'cyan'}
            >
              {p.client && <p className="text-[10px] uppercase tracking-widest text-neon-magenta">cliente: {p.client}</p>}
              {p.description && <p className="mt-1 text-xs text-neon-dim">{p.description}</p>}
              {p.due_date && <p className="mt-1 text-[10px] text-neon-dim">prazo: {p.due_date}</p>}
              {p.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span key={t} className="border border-neon-cyan/40 px-1.5 py-0.5 text-[10px] text-neon-cyan">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between text-[10px] uppercase tracking-widest text-neon-dim">
                <span>progresso</span>
                <span>
                  {done}/{ms.length}
                </span>
              </div>
              <Progress value={done} max={ms.length} color="green" className="mt-1" />
              <div className="mt-3 flex flex-wrap gap-2">
                <NeonButton variant="cyan" className="px-2 py-1" onClick={() => openEdit(p)}>
                  editar
                </NeonButton>
                {p.status !== 'arquivado' ? (
                  <NeonButton variant="yellow" className="px-2 py-1" onClick={() => setStatus(p, 'arquivado')}>
                    arquivar
                  </NeonButton>
                ) : (
                  <NeonButton variant="green" className="px-2 py-1" onClick={() => setStatus(p, 'ativo')}>
                    reativar
                  </NeonButton>
                )}
              </div>
            </NeonPanel>
          )
        })}
        {shown.length === 0 && (
          <p className="font-display text-xs uppercase tracking-[0.3em] text-neon-dim">
            // nenhum projeto {filter}
          </p>
        )}
      </div>

      {draft && (
        <NeonPanel title={`// editar: ${draft.title}`} accent="magenta" className="md:col-span-2 xl:col-span-3">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              placeholder="título *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="cliente"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className={inputClass}
            />
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
              className={`${inputClass} sm:col-span-2 lg:col-span-5`}
            />
          </form>
        </NeonPanel>
      )}
    </div>
  )
}
