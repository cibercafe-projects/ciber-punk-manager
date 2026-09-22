import { Howl, Howler } from 'howler'
import { useUi } from '../stores/ui'

// Sons do usuário em public/sfx/ (.ogg) — mapeados por token;
// se um arquivo estiver ausente, o Howler falha em silêncio (no-op).
const SFX_FILES: Record<string, string[]> = {
  click: ['/sfx/game.ogg', '/sfx/electronic (2).ogg'],
  reward: ['/sfx/money.ogg'],
  unlock: ['/sfx/level-up1.ogg'],
  error: ['/sfx/death.ogg'],
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
