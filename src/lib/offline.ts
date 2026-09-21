import { syncQueue, pendingOps } from './db'
import { useOffline } from '../stores/offline'

let started = false

// Mantém o estado online sincronizado com o navegador e
// drena a fila de mutações ao reconectar (FR-009).
export function startOfflineSync() {
  if (started) return
  started = true

  const goOnline = async () => {
    useOffline.getState().setOnline(true)
    if (pendingOps() > 0) await syncQueue()
  }
  const goOffline = () => useOffline.getState().setOnline(false)

  window.addEventListener('online', goOnline)
  window.addEventListener('offline', goOffline)

  // Reconcilia estado real com o Supabase ao voltar (banner garante a fila).
  if (navigator.onLine) void goOnline()
}
