import { supabase } from './supabase'
import { useOffline } from '../stores/offline'
import { missionReward, achievementProgress } from './rewards'
import type { Achievement, Mission, Project, UserAchievement } from '../types'

type OwnTable = 'profiles' | 'projects' | 'missions'

function stash(table: OwnTable, payload: Record<string, unknown>) {
  useOffline.getState().push({ kind: { table, action: 'upsert' }, payload, at: Date.now() })
}

async function tryRemote(table: OwnTable, row: Record<string, unknown>) {
  try {
    const { error } = await supabase.from(table).upsert(row)
    if (error) throw error
  } catch (e) {
    if (e instanceof Error && e.message === 'SUPABASE_UNREACHABLE') {
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

export async function saveProfile(profile: Partial<{ id: string; handle: string; xp: number; eddies: number; config: Record<string, unknown> }>) {
  return tryRemote('profiles', profile)
}

// ---------- projects ----------
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('position')
  if (error) throw new Error('SUPABASE_UNREACHABLE')
  return data as Project[]
}

export async function upsertProject(p: Partial<Project>): Promise<Project | null> {
  const online = await tryRemote('projects', p as Record<string, unknown>)
  if (!online) return p as Project
  const { data } = await supabase.from('projects').upsert(p).select().maybeSingle()
  return data as Project | null
}

// ---------- missions ----------
export async function listMissions(): Promise<Mission[]> {
  const { data, error } = await supabase.from('missions').select('*').order('position')
  if (error) throw new Error('SUPABASE_UNREACHABLE')
  return data as Mission[]
}

export async function upsertMission(m: Partial<Mission>): Promise<Mission | null> {
  const online = await tryRemote('missions', m as Record<string, unknown>)
  if (!online) return m as Mission
  const { data } = await supabase.from('missions').upsert(m).select().maybeSingle()
  return data as Mission | null
}

// Conclusão idempotente (FR-005a/FR-011): única porta de concessão de recompensa
export async function completeMission(mission: Mission) {
  if (!mission.completed_at) {
    const { xp, eddies } = missionReward(mission.priority, mission.difficulty)
    const done = await tryRemote('missions', {
      id: mission.id,
      status: 'concluida' as const,
      completed_at: new Date().toISOString(),
    })
    if (!done) {
      await supabase.from('events').insert({
        type: 'mission_completed',
        payload: { mission_id: mission.id, code: mission.code, xp, eddies },
      })
      await grantProfileGain(xp, eddies)
      const unlocked = await checkAchievements()
      return { xp, eddies, unlocked }
    }
    return null
  }
  return null
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
