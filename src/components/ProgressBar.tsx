interface ProgressBarProps {
  value: number
  max: number
  color?: 'cyan' | 'magenta' | 'green' | 'yellow'
  className?: string
}

const colors = {
  cyan: 'bg-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]',
  magenta: 'bg-neon-magenta shadow-[0_0_8px_rgba(255,45,149,0.6)]',
  green: 'bg-neon-green shadow-[0_0_8px_rgba(10,255,108,0.6)]',
  yellow: 'bg-neon-yellow shadow-[0_0_8px_rgba(245,208,47,0.6)]',
} as const

export function Progress({ value, max, color = 'cyan', className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-neon-surface2 ${className}`} role="progressbar">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${colors[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
