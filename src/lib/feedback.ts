import type { SfxToken } from './audio'
import { playSfx } from './audio'
import { xpProgress } from './rewards'
import type { ToastKind } from '../components/Toast'

type ToastFn = (kind: ToastKind, message: string) => void

export interface RewardResult {
  xp: number
  eddies: number
  unlocked: { name: string; reward_xp: number; reward_eddies: number }[]
}

// Feedback padrão após completeMission: toasts (reward/conquistas) + sons,
// com sfx de level-up (sorteio) quando o XP cruza um limiar de nível.
export function notifyRewards(
  show: ToastFn,
  missionLabel: string,
  result: RewardResult,
  handleBonus?: { type: 'levelUp' | 'recharge' | 'hacks' },
) {
  playSfx('reward')
  show('reward', `${result.xp > 0 ? `+${result.xp} XP · +${result.eddies} ₡ — ` : ''}${missionLabel}`)
  for (const a of result.unlocked) {
    playSfx('unlock')
    show('reward', `conquista: ${a.name} (+${a.reward_xp}xp +${a.reward_eddies}₡)`)
  }
  if (handleBonus) playSfx(handleBonus.type as SfxToken)
}

// Detecta level-up comparando níveis antes/depois de ganhos totais (missão + conquistas).
export function detectLevelUp(xpBefore: number, result: RewardResult) {
  const gained = result.xp + result.unlocked.reduce((acc, a) => acc + a.reward_xp, 0)
  return xpProgress(xpBefore + gained).level > xpProgress(xpBefore).level
}
