import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BackgroundKind = 'solid' | 'image' | 'random'

export interface UiState {
  soundOn: boolean
  volume: number
  backgroundKind: BackgroundKind
  backgroundUrl: string
  backgroundOpacity: number
  toggleSound: () => void
  setVolume: (v: number) => void
  setBackground: (kind: BackgroundKind, url?: string, opacity?: number) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      soundOn: false,
      volume: 0.6,
      backgroundKind: 'solid',
      backgroundUrl: '',
      backgroundOpacity: 0.35,
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      setVolume: (volume) => set({ volume }),
      setBackground: (backgroundKind, backgroundUrl, backgroundOpacity) =>
        set((s) => ({
          backgroundKind,
          backgroundUrl: backgroundUrl ?? s.backgroundUrl,
          backgroundOpacity: backgroundOpacity ?? s.backgroundOpacity,
        })),
    }),
    { name: 'nts-ui' },
  ),
)
