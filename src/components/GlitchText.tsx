export function GlitchText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`relative inline-block animate-[flicker_4s_infinite] ${className}`} data-text={children}>
      <span aria-hidden="true" className="absolute inset-0 translate-x-[2px] text-neon-magenta opacity-70 animate-[glitch-anim_2.4s_infinite_steps(2)]">
        {children}
      </span>
      <span aria-hidden="true" className="absolute inset-0 -translate-x-[2px] text-neon-cyan opacity-70 animate-[glitch-anim_3.1s_infinite_steps(2)_reverse]">
        {children}
      </span>
      {children}
    </span>
  )
}
