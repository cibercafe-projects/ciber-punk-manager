import { Howl, Howler } from 'howler'
import { useUi } from '../stores/ui'

// Sons do usuário serão adicionados depois em src/assets/sfx/.
// Cada token aponta para um arquivo; se ausente, o Howler falha em silêncio (no-op).
const SFX_FILES: Record<string, string[]> = {
  click: ['/sfx/click.wav', '/sfx/click.mp3'],
  reward: ['/sfx/reward.wav', '/sfx/reward.mp3'],
  unlock: ['/sfx/unlock.wav', '/sfx/unlock.mp3'],
  error: ['/sfx/error.wav', '/sfx/error.mp3'],
}

const cache = new Map<string, Howl | null>()

function getHowl(token: string): Howl | null {
  if (cache.has(token)) return cache.get(token) ?? null
  const files = SFX_FILES[token]
  if (!files) return null
  const howl = new Howl({ src: files, volume: 1, preload: true, onloaderror: () => undefined })
  cache.set(token, howl)
  return howl
}

export function applyVolume() {
  const { soundOn, volume } = useUi.getState()
  Howler.volume(soundOn ? volume : 0)
}

export function playSfx(token: keyof typeof SFX_FILES) {
  const { soundOn } = useUi.getState()
  if (!soundOn) return
  const howl = getHowl(token)
  if (howl) howl.play()
}
