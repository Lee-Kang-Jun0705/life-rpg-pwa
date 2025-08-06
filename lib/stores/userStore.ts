import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  level: number
  experience: number
  coins: number
  gems: number
}

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  addGems: (amount: number) => void
  spendGems: (amount: number) => boolean
  addExperience: (amount: number) => void
  resetUser: () => void
}

const defaultUser: User = {
  id: 'default-user', // GAME_CONFIG와 일치시킴
  name: '모험가',
  level: 1,
  experience: 0,
  coins: 1000, // 시작 코인
  gems: 0
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      
      setUser: (user) => set({ user }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      addCoins: (amount) => set((state) => ({
        user: state.user 
          ? { ...state.user, coins: state.user.coins + amount }
          : null
      })),
      
      spendCoins: (amount) => {
        const state = get()
        if (!state.user || state.user.coins < amount) {
          return false
        }
        set({
          user: { ...state.user, coins: state.user.coins - amount }
        })
        return true
      },
      
      addGems: (amount) => set((state) => ({
        user: state.user 
          ? { ...state.user, gems: state.user.gems + amount }
          : null
      })),
      
      spendGems: (amount) => {
        const state = get()
        if (!state.user || state.user.gems < amount) {
          return false
        }
        set({
          user: { ...state.user, gems: state.user.gems - amount }
        })
        return true
      },
      
      addExperience: (amount) => set((state) => {
        if (!state.user) return { user: null }
        
        const newExperience = state.user.experience + amount
        const newLevel = Math.floor(Math.sqrt(newExperience / 100)) + 1
        
        return {
          user: {
            ...state.user,
            experience: newExperience,
            level: newLevel
          }
        }
      }),
      
      resetUser: () => set({ user: defaultUser })
    }),
    {
      name: 'life-rpg-user-store'
    }
  )
)