import type { Priority } from '../types'


// Fórmula fixa (FR-005): xp = 20 × dificuldade × fator_prioridade; eddies = 10 × dificuldade
const PRIORITY_FACTOR: Record<Priority, number> = { alta: 1.5, media: 1.2, baixa: 1.0 }
const LEVEL_STEP = 120

export function missionReward(priority: Priority, difficulty: number) {
  const f = PRIORITY_FACTOR[priority] ?? 1
  return { xp: Math.round(20 * difficulty * f), eddies: 10 * difficulty }
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / LEVEL_STEP) + 1)
}

export function xpForLevel(level: number): number {
  return LEVEL_STEP * (level - 1)
}

export function xpProgress(xp: number): { level: number; remaining: number; total: number } {
  const level = levelFromXp(xp)
  const base = xpForLevel(level)
  const spent = xp - base
  return { level, remaining: LEVEL_STEP - spent, total: LEVEL_STEP }
}

export function nextLevelXp(xp: number): number {
  const level = levelFromXp(xp)
  return xpForLevel(level + 1)
}

// Nível alvo de conquista "legend_corpo"
export function achievementProgress(
  criterion: { type: string; target: number },
  ctx: { missionsCompleted: number; projectsDone: number; focusMinutes: number; missionsOntime: number; missionsLate: number; streak: number; xp: number },
): number {
  const m: Record<string, number> = {
    missions_completed: ctx.missionsCompleted,
    project_done: ctx.projectsDone,
    focus_minutes: ctx.focusMinutes,
    missions_ontime: ctx.missionsOntime,
    missions_late: ctx.missionsLate,
    streak: ctx.streak,
    level: levelFromXp(ctx.xp),
  }
  return m[criterion.type] ?? 0
}

const RARITY_COLORS: Record<string, string> = {
  comum: 'neon-cyan',
  rara: 'neon-green',
  épicas: 'neon-magenta',
  especiais: 'neon-magenta',
  lendária: 'neon-yellow',
}

export function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? 'neon-cyan'
}