import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BattleStore {
  isInBattle: boolean
  setIsInBattle: (isInBattle: boolean) => void
  battleSpeed: number
  setBattleSpeed: (speed: number) => void
}

export const useBattleStore = create<BattleStore>()(
  persist(
    (set) => ({
      isInBattle: false,
      setIsInBattle: (isInBattle) => set({ isInBattle }),
      battleSpeed: 1,
      setBattleSpeed: (speed) => set({ battleSpeed: speed }),
    }),
    {
      name: 'battle-storage',
      partialize: (state) => ({ battleSpeed: state.battleSpeed }), // isInBattle은 저장하지 않음
    }
  )
)