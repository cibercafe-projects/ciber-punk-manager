import { create } from 'zustand'
import { listProjects, upsertProject, listMissions, upsertMission } from '../lib/db'
import type { Project, Mission } from '../types'

// Cache compartilhado de projetos/missões entre as telas (Dashboard/Missões/Kanban).
interface DataState {
  projects: Project[]
  missions: Mission[]
  loading: boolean
  loadAll: () => Promise<void>
  saveProject: (p: Partial<Project>) => Promise<void>
  saveMission: (m: Partial<Mission>) => Promise<void>
}

export const useData = create<DataState>()((set, get) => ({
  projects: [],
  missions: [],
  loading: false,
  loadAll: async () => {
    set({ loading: true })
    const [projects, missions] = await Promise.all([listProjects(), listMissions()])
    set({ projects, missions, loading: false })
  },
  saveProject: async (p) => {
    const saved = await upsertProject(p)
    if (saved) {
      set({
        projects: saved.id && get().projects.some((x) => x.id === saved.id)
          ? get().projects.map((x) => (x.id === saved.id ? saved : x))
          : [...get().projects, saved],
      })
    } else {
      // offline: projeta otimisticamente a partir do payload
      void get().loadAll()
    }
  },
  saveMission: async (m) => {
    const saved = await upsertMission(m)
    if (saved) {
      set({
        missions: saved.id && get().missions.some((x) => x.id === saved.id)
          ? get().missions.map((x) => (x.id === saved.id ? saved : x))
          : [...get().missions, saved],
      })
    } else {
      void get().loadAll()
    }
  },
}))
