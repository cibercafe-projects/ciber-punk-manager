import { useEffect, useState } from 'react'
import { NeonPanel } from '../components/NeonPanel'
import { GlitchText } from '../components/GlitchText'
import { listAchievements, listUserAchievements } from '../lib/db'
import { rarityColor } from '../lib/rewards'
import type { Achievement, UserAchievement } from '../types'

export default function Album() {
  const [achs, setAchs] = useState<Achievement[]>([])
  const [unlocks, setUnlocks] = useState<UserAchievement[]>([])

  useEffect(() => {
    void listAchievements().then(setAchs)
    void listUserAchievements().then(setUnlocks)
  }, [])

  const collected = achs.filter((a) => unlocks.some((u) => u.achievement_id === a.id && u.unlocked_at))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl tracking-[0.2em] text-neon-green font-cyber">
        <GlitchText>{`ÁLBUM ${collected.length}/${achs.length}`}</GlitchText>
      </h1>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {achs.map((a) => {
          const u = unlocks.find((x) => x.achievement_id === a.id)
          const unlocked = !!u?.unlocked_at
          return (
            <div
              key={a.id}
              className={`scanlines relative aspect-[3/4] rounded-sm border bg-neon-surface p-3 text-center ${
                unlocked
                  ? 'neon-border shadow-[0_0_16px_rgba(0,240,255,0.2)]'
                  : 'border-neon-dim/40 opacity-60'
              }`}
            >
              <p className="font-display text-[10px] uppercase tracking-widest text-neon-dim">
                {unlocked ? a.rarity : 'bloqueada'}
              </p>
              {unlocked ? (
                <>
                  <div className="my-3 flex h-24 items-center justify-center text-4xl">
                    {a.artwork_ref ? (
                      <img src={a.artwork_ref} alt={a.name} className="h-full object-contain" />
                    ) : a.code.slice(0, 2).toUpperCase()}
                  </div>
                  <p className={`font-display text-xs uppercase tracking-widest ${rarityColor(a.rarity)}`}>
                    {a.name}
                  </p>
                  <p className="mt-1 text-[10px] text-neon-dim">{u?.unlocked_at?.slice(0, 10)}</p>
                </>
              ) : (
                <>
                  <div className="my-3 flex h-24 items-center justify-center font-display text-4xl text-neon-dim">
                    ???
                  </div>
                  <p className="font-display text-xs uppercase tracking-widest text-neon-dim">???</p>
                </>
              )}
            </div>
          )
        })}
        {achs.length === 0 && (
          <NeonPanel className="col-span-full">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-neon-dim">
              // seed de conquistas não aplicado — rode 002 no SQL editor
            </p>
          </NeonPanel>
        )}
      </div>
    </div>
  )
}
