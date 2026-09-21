import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type ToastKind = 'info' | 'success' | 'error' | 'reward'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  show: (kind: ToastKind, message: string) => void
}

const ToastCtx = createContext<ToastApi>({ show: () => {} })

const kindColors = {
  info: 'neon-border',
  success: 'border border-neon-green/60 shadow-[0_0_12px_rgba(10,255,108,0.3)]',
  error: 'border border-neon-red/60 shadow-[0_0_12px_rgba(255,59,59,0.3)]',
  reward: 'neon-border-magenta',
} as const

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, message }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`scanlines rounded-sm bg-neon-surface px-4 py-3 text-xs ${kindColors[t.kind]}`}
          >
            <span className="font-display text-[10px] uppercase tracking-[0.25em] text-neon-dim">
              {t.kind}
            </span>
            <p className="text-neon-cyan">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
