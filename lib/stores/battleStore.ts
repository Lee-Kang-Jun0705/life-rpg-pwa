import { create } from 'zustand'

interface BattleStore {
  isInBattle: boolean
  setIsInBattle: (isInBattle: boolean) => void
  battleSpeed: number
  setBattleSpeed: (speed: number) => void
}

export const useBattleStore = create<BattleStore>((set) => ({
  isInBattle: false,
  setIsInBattle: (isInBattle) => set({ isInBattle }),
  battleSpeed: 1,
  setBattleSpeed: (speed) => {
    console.log('🏪 battleStore: 배속 변경 요청', speed)
    set({ battleSpeed: speed })
    console.log('🏪 battleStore: 배속 변경 완료', speed)
  }
}))
