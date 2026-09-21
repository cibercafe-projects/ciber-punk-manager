import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useSession } from './stores/session'
import { useOffline } from './stores/offline'
import { startOfflineSync } from './lib/offline'
import { applyVolume } from './lib/audio'
import { useUi } from './stores/ui'
import { ToastProvider } from './components/Toast'
import { Layout } from './Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Missions from './pages/Missions'
import Kanban from './pages/Kanban'
import FocusMode from './pages/FocusMode'
import Achievements from './pages/Achievements'
import Album from './pages/Album'
import Terminal from './pages/Terminal'
import Settings from './pages/Settings'

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession()
  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="animate-[flicker_1.5s_infinite] font-display text-xs tracking-[0.3em] text-neon-cyan">
          conectando à rede…
        </p>
      </main>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const setUser = useSession((s) => s.setUser)
  const loadProfile = useSession((s) => s.loadProfile)
  const setOnline = useOffline((s) => s.setOnline)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    applyVolume()
    return useUi.subscribe(applyVolume) as unknown as () => void
  }, [])

  useEffect(() => {
    startOfflineSync()
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? '' } : null)
      if (u) {
        setAuthed(true)
        setOnline(true)
        void loadProfile()
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? '' } : null)
      if (u && event === 'SIGNED_IN') {
        setAuthed(true)
        setOnline(true)
        void loadProfile()
      }
      if (event === 'SIGNED_OUT') setAuthed(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [setUser, loadProfile, setOnline])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setAuthed(false)
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
          <Route
            element={
              <Guard>
                <Layout onSignOut={handleSignOut} />
              </Guard>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/missoes" element={<Missions />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/focus" element={<FocusMode />} />
            <Route path="/conquistas" element={<Achievements />} />
            <Route path="/album" element={<Album />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/config" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
