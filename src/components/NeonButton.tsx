import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red'
  children: ReactNode
}

const variants = {
  cyan: 'border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 shadow-[0_0_8px_rgba(0,240,255,0.25)]',
  magenta:
    'border-neon-magenta/60 text-neon-magenta hover:bg-neon-magenta/10 shadow-[0_0_8px_rgba(255,45,149,0.25)]',
  green: 'border-neon-green/60 text-neon-green hover:bg-neon-green/10 shadow-[0_0_8px_rgba(10,255,108,0.25)]',
  yellow:
    'border-neon-yellow/60 text-neon-yellow hover:bg-neon-yellow/10 shadow-[0_0_8px_rgba(245,208,47,0.25)]',
  red: 'border-neon-red/60 text-neon-red hover:bg-neon-red/10 shadow-[0_0_8px_rgba(255,59,59,0.25)]',
} as const

export function NeonButton({
  variant = 'cyan',
  className = '',
  children,
  ...rest
}: NeonButtonProps) {
  return (
    <button
      className={`font-display cursor-pointer rounded-sm border bg-transparent px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
