import { create } from 'zustand'
import { supabase } from '../lib/supabase'
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
  loadProfile: async () => {
    if (!supabase) return null
    const { data } = await supabase.from('profiles').select('*').maybeSingle()
    if (data) {
      const p = data as Profile
      set({ profile: p })
      return p
    }
    return null
  },
}))
