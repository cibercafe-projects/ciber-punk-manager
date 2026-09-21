import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  color?: 'cyan' | 'magenta' | 'green' | 'yellow'
}

const colors = {
  cyan: 'text-neon-cyan',
  magenta: 'text-neon-magenta',
  green: 'text-neon-green',
  yellow: 'text-neon-yellow',
} as const

export function StatCard({ label, value, hint, color = 'cyan' }: StatCardProps) {
  return (
    <div className="neon-border scanlines rounded-sm bg-neon-surface px-4 py-3">
      <p className="font-display text-[10px] uppercase tracking-[0.25em] text-neon-dim">{label}</p>
      <p className={`mt-1 font-display text-2xl ${colors[color]}`}>{value}</p>
      {hint && <p className="mt-1 text-[10px] text-neon-dim">{hint}</p>}
    </div>
  )
}
