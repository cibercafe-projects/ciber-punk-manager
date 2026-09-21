import type { ReactNode } from 'react'

interface NeonPanelProps {
  title?: string
  accent?: 'cyan' | 'magenta' | 'green' | 'yellow'
  className?: string
  children: ReactNode
}

const accentClass = {
  cyan: 'neon-border',
  magenta: 'neon-border-magenta',
  green: 'border border-neon-green/45 shadow-[0_0_12px_rgba(10,255,108,0.18)]',
  yellow: 'border border-neon-yellow/45 shadow-[0_0_12px_rgba(245,208,47,0.18)]',
} as const

const dotClass = {
  cyan: 'bg-neon-cyan',
  magenta: 'bg-neon-magenta',
  green: 'bg-neon-green',
  yellow: 'bg-neon-yellow',
} as const

export function NeonPanel({ title, accent = 'cyan', className = '', children }: NeonPanelProps) {
  return (
    <section className={`scanlines rounded-sm bg-neon-surface ${accentClass[accent]} ${className}`}>
      {title && (
        <header className="flex items-center gap-2 border-b border-neon-cyan/20 px-4 py-2">
          <span className={`h-2 w-2 shadow-[0_0_6px_currentColor] ${dotClass[accent]}`} />
          <h2 className="font-display text-xs uppercase tracking-[0.25em] text-neon-cyan">{title}</h2>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
