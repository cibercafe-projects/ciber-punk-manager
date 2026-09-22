import { Howl, Howler } from 'howler'
import { useUi } from '../stores/ui'

// Sons do usuário em public/sfx/ (.ogg) — mapeados por token;
// se um arquivo estiver ausente, o Howler falha em silêncio (no-op).
// Quando um token tem vários arquivos, um é sorteado a cada toque.
const SFX_FILES: Record<string, string[]> = {
  click: ['/sfx/game.ogg', '/sfx/electronic (2).ogg'],
  reward: ['/sfx/money.ogg'],
  unlock: ['/sfx/level-up1.ogg'],
  error: ['/sfx/death.ogg'],
  levelUp: ['/sfx/level-up2.ogg', '/sfx/level-up3.ogg', '/sfx/level-up4.ogg', '/sfx/level-up5.ogg', '/sfx/level-up6.ogg'],
  recharge: ['/sfx/recharge.ogg'],
  hacks: ['/sfx/hacks.ogg'],
}

const cache = new Map<string, Howl | null>()

function getHowl(token: string): Howl | null {
  const files = SFX_FILES[token]
  if (!files?.length) return null
  // sorteia entre as opções do token (com cache por arquivo)
  const chosen = files[Math.floor(Math.random() * files.length)]
  const key = `${token}:${chosen}`
  if (cache.has(key)) return cache.get(key) ?? null
  const howl = new Howl({ src: [chosen], volume: 1, preload: true, onloaderror: () => undefined })
  cache.set(key, howl)
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

export type SfxToken = keyof typeof SFX_FILES
