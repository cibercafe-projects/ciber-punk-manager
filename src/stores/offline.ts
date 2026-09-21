import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type PersistedOp = {
  kind:
    | { table: 'projects'; action: 'upsert' }
    | { table: 'missions'; action: 'upsert' }
    | { table: 'profiles'; action: 'upsert' }
  payload: Record<string, unknown>
  at: number
}

interface OfflineState {
  queue: PersistedOp[]
  online: boolean
  setOnline: (v: boolean) => void
  push: (op: PersistedOp) => void
  flush: (exec: (op: PersistedOp) => Promise<void>) => Promise<void>
}

export const useOffline = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],
      online: navigator.onLine,
      setOnline: (v) => set({ online: v }),
      push: (op) => set({ queue: [...get().queue, op] }),
      flush: async (exec) => {
        const q = get().queue
        const failed: PersistedOp[] = []
        for (const op of q) {
          try {
            await exec(op)
          } catch {
            failed.push(op)
          }
        }
        set({ queue: failed })
      },
    }),
    { name: 'nts-offline-queue' },
  ),
)
