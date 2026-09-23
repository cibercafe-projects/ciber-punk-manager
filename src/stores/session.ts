import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { ensureProfile } from '../lib/db'
import type { Profile } from '../types'

interface SessionState {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  setUser: (u: SessionState['user']) => void
  setProfile: (p: Profile | null) => void
  loadProfile: () => Promise<Profile | null>
}

export const useSession = create<SessionState>()((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) => set({ profile }),
  loadProfile: () => {
    // dedupe: boot dispara getSession + onAuthStateChange quase juntos
    if (!inFlight) {
      inFlight = doLoad()
    }
    return inFlight
  },
}))

let inFlight: Promise<Profile | null> | null = null

async function doLoad() {
  try {
    if (!supabase) return null
    const p = await ensureProfile()
    if (p) useSession.setState({ profile: p })
    return p
  } finally {
    inFlight = null
  }
}
