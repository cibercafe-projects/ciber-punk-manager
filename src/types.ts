export type ProjectStatus = 'ativo' | 'arquivado' | 'concluido'
export type Priority = 'alta' | 'media' | 'baixa'
export type MissionStatus = 'a_fazer' | 'em_andamento' | 'concluida'

export interface Profile {
  id: string
  handle: string
  xp: number
  eddies: number
  streak_days: number
  config: Record<string, unknown>
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string
  client: string | null
  due_date: string | null
  tags: string[]
  status: ProjectStatus
  position: number
}

export interface ChecklistItem {
  text: string
  done: boolean
}

export interface Mission {
  id: string
  user_id: string
  project_id: string
  code: string
  title: string
  description: string
  priority: Priority
  difficulty: number
  due_date: string | null
  tags: string[]
  status: MissionStatus
  checklist: ChecklistItem[]
  focus_seconds: number
  position: number
  completed_at: string | null
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  criterion: { type: string; target: number }
  rarity: string
  artwork_ref: string | null
  reward_xp: number
  reward_eddies: number
  unlocked_message: string | null
}

export interface UserAchievement {
  achievement_id: string
  progress: number
  unlocked_at: string | null
}
