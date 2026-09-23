import { supabase } from './supabase'
import { useOffline } from '../stores/offline'
import { missionReward, achievementProgress } from './rewards'
import type { Achievement, Mission, Project, Profile, UserAchievement } from '../types'

type OwnTable = 'profiles' | 'projects' | 'missions'

const NETWORK_FAIL = /fetch failed|failed to fetch|networkerror|network error|load failed|networkerror when attempting/i

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError || (e instanceof Error && NETWORK_FAIL.test(e.message))
}

function stash(table: OwnTable, payload: Record<string, unknown>) {
  useOffline.getState().push({ kind: { table, action: 'upsert' }, payload, at: Date.now() })
}

async function tryRemote(table: OwnTable, row: Record<string, unknown>) {
  // offline declarado: stash direto, sem tentar remoto (FR-009)
  if (!useOffline.getState().online) {
    stash(table, row)
    return false
  }
  try {
    const { error } = await supabase.from(table).upsert(row)
    if (error) throw error
  } catch (e) {
    if (isNetworkError(e)) {
      useOffline.getState().setOnline(false)
      stash(table, row)
      return false
    }
    throw e
  }
  return true
}

// ---------- fila offline ----------
export async function syncQueue(): Promise<number> {
  const { flush, queue } = useOffline.getState()
  if (!queue.length) return 0
  const before = queue.length
  await flush(async (op) => {
    const { error } = await supabase.from(op.kind.table).upsert(op.payload)
    if (error) throw error
  })
  return before
}

export function pendingOps(): number {
  return useOffline.getState().queue.length
}

// ---------- profile ----------
export async function getProfile() {
  const { data } = await supabase.from('profiles').select('*').maybeSingle()
  return data
}

// Garante linha em profiles após signup (trigger do banco pode não ter rodado).
export async function ensureProfile(): Promise<Profile | null> {
  const existing = await getProfile()
  if (existing) return existing as Profile
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return null
  const { error } = await supabase.from('profiles').upsert({ id: uid })
  if (error) {
    if (isNetworkError(error)) return null
    throw error
  }
  const { data: created } = await supabase.from('profiles').select('*').maybeSingle()
  return created as Profile | null
}

export async function saveProfile(profile: Partial<{ id: string; handle: string; xp: number; eddies: number; config: Record<string, unknown> }>) {
  return tryRemote('profiles', profile)
}

// ---------- projects ----------
export async function listProjects(): Promise<Project[]> {
  // tolerante: rede fora / RLS sem linha → lista vazia (tela renderiza, sem crash)
  try {
    const { data } = await supabase.from('projects').select('*').order('position')
    return (data ?? []) as Project[]
  } catch (e) {
    if (isNetworkError(e)) useOffline.getState().setOnline(false)
    return []
  }
}

export async function upsertProject(p: Partial<Project>): Promise<Project | null> {
  const online = await tryRemote('projects', p as Record<string, unknown>)
  if (!online) return p as Project
  const { data } = await supabase.from('projects').upsert(p).select().maybeSingle()
  return data as Project | null
}

// ---------- missions ----------
// ---------- missions ----------
export async function listMissions(): Promise<Mission[]> {
  try {
    const { data } = await supabase.from('missions').select('*').order('position')
    return (data ?? []) as Mission[]
  } catch (e) {
    if (isNetworkError(e)) useOffline.getState().setOnline(false)
    return []
  }
}

// Código de missão estilo BRAKA-042: sigla 2 chars do projeto + seq dentro da sigla.
export function nextMissionCode(projectTitle: string, missions: Mission[]): string {
  const sigla =
    (projectTitle.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'NT') + '-M'
  let seq = 1
  const hex = crypto.randomUUID().slice(0, 4)
  for (const m of missions) {
    const match = /^(.+)-M(\d+)$/.exec(m.code)
    if (match && match[1] === sigla.slice(0, -2)) seq = Math.max(seq, Number(match[2]) + 1)
  }
  // se ainda assim colidir (código manual), apêndice hex garante unique(user_id, code)
  if (missions.some((m) => m.code === `${sigla}${seq}`)) return `${sigla}${seq}-${hex}`
  return `${sigla}${seq}`
}

export async function upsertMission(m: Partial<Mission>): Promise<Mission | null> {
  const online = await tryRemote('missions', m as Record<string, unknown>)
  if (!online) return m as Mission
  const { data } = await supabase.from('missions').upsert(m).select().maybeSingle()
  return data as Mission | null
}

// Conclusão idempotente (FR-005a/FR-011): única porta de concessão de recompensa
export async function completeMission(mission: Mission) {
  if (mission.completed_at) return null
  const { xp, eddies } = missionReward(mission.priority, mission.difficulty)
  const ok = await tryRemote('missions', {
    id: mission.id,
    status: 'concluida' as const,
    completed_at: new Date().toISOString(),
  })
  if (!ok) return null // enfileirado offline; recompensa avaliada online depois
  await supabase.from('events').insert({
    type: 'mission_completed',
    payload: { mission_id: mission.id, code: mission.code, xp, eddies },
  })
  await grantProfileGain(xp, eddies)
  const unlocked = await checkAchievements()
  return { xp, eddies, unlocked }
}

async function grantProfileGain(xp: number, eddies: number) {
  const profile = await getProfile()
  if (!profile) return
  const updated = await tryRemote('profiles', {
    id: profile.id,
    xp: profile.xp + xp,
    eddies: profile.eddies + eddies,
  })
  if (updated) {
    await supabase.from('events').insert({ type: 'xp', payload: { xp, eddies } })
  }
}

// ---------- achievements ----------
export async function listAchievements(): Promise<Achievement[]> {
  const { data } = await supabase.from('achievements').select('*')
  return (data ?? []) as Achievement[]
}

export async function listUserAchievements(): Promise<UserAchievement[]> {
  const { data } = await supabase.from('user_achievements').select('*')
  return (data ?? []) as UserAchievement[]
}

function milestones(
  missions: Mission[],
  projects: Project[],
  xp: number,
  streak: number,
) {
  const completed = missions.filter((m) => m.status === 'concluida')
  const ontime = completed.filter((m) => !m.due_date || (m.completed_at?.slice(0, 10) ?? '') <= m.due_date)
  const late = completed.filter((m) => m.due_date && (m.completed_at?.slice(0, 10) ?? '') > m.due_date)
  const focusMinutes = missions.reduce((acc, m) => acc + m.focus_seconds, 0) / 60
  const projectsDone = projects.filter((p) => p.status === 'concluido').length
  return {
    missionsCompleted: completed.length,
    projectsDone,
    focusMinutes: Math.round(focusMinutes),
    missionsOntime: ontime.length,
    missionsLate: late.length,
    streak,
    xp,
  }
}

export async function checkAchievements() {
  const [missions, projects, profile, achRes, unlockRes] = await Promise.all([
    listMissions(),
    listProjects(),
    getProfile(),
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('*'),
  ])
  const achs = achRes.data as Achievement[]
  const unlocks = unlockRes.data as UserAchievement[]
  const ctx = milestones(missions, projects, profile?.xp ?? 0, profile?.streak_days ?? 0)
  const newlyUnlocked: Achievement[] = []
  for (const ach of achs) {
    const existing = unlocks.find((u) => u.achievement_id === ach.id)
    if (existing?.unlocked_at) continue
    const prog = achievementProgress(ach.criterion, ctx)
    const reached = prog >= ach.criterion.target
    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: profile?.id,
        achievement_id: ach.id,
        progress: prog,
        unlocked_at: reached ? new Date().toISOString() : null,
      })
    if (error) continue
    if (reached) {
      newlyUnlocked.push(ach)
      await grantProfileGain(ach.reward_xp, ach.reward_eddies)
      await supabase
        .from('events')
        .insert({ type: 'achievement', payload: { code: ach.code, name: ach.name } })
    } else if (existing && prog !== existing.progress) {
      await supabase.from('user_achievements').upsert({
        user_id: profile?.id,
        achievement_id: ach.id,
        progress: prog,
        unlocked_at: null,
      })
    }
  }
  return newlyUnlocked
}

// ---------- focus ----------
export async function addFocusSeconds(mission: Mission, seconds: number) {
  if (!seconds) return
  await tryRemote('missions', {
    id: mission.id,
    focus_seconds: mission.focus_seconds + seconds,
  })
}
