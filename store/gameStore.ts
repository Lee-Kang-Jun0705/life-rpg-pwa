import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { IdGenerators } from '@/lib/utils/id-generator'

interface Activity {
  id: string
  name: string
  description: string
  experience: number
  completed: boolean
  lastCompleted?: Date
  createdAt: Date
}

interface Player {
  level: number
  exp: number
  gold: number
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
}

interface GameState {
  player: Player
  activities: Activity[]
  updatePlayer: (updates: Partial<Player>) => void
  addExp: (amount: number) => void
  updateActivity: (id: string, updates: Partial<Activity>) => void
  completeActivity: (id: string) => void
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void
}

const calculateLevel = (exp: number): number => {
  return Math.floor(Math.sqrt(exp / 100)) + 1
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      player: {
        level: 1,
        exp: 0,
        gold: 100,
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
      },
      activities: [],
      
      updatePlayer: (updates) =>
        set((state) => ({
          player: { ...state.player, ...updates },
        })),
      
      addExp: (amount) =>
        set((state) => {
          const newExp = state.player.exp + amount
          const newLevel = calculateLevel(newExp)
          const levelUp = newLevel > state.player.level
          
          return {
            player: {
              ...state.player,
              exp: newExp,
              level: newLevel,
              // 레벨업 시 체력/에너지 회복
              health: levelUp ? state.player.maxHealth : state.player.health,
              energy: levelUp ? state.player.maxEnergy : state.player.energy,
            },
          }
        }),
      
      updateActivity: (id, updates) =>
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updates } : activity
          ),
        })),
      
      completeActivity: (id) =>
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id
              ? { ...activity, completed: true, lastCompleted: new Date() }
              : activity
          ),
        })),
      
      addActivity: (activityData) =>
        set((state) => ({
          activities: [
            ...state.activities,
            {
              ...activityData,
              id: IdGenerators.activity(),
              createdAt: new Date(),
            },
          ],
        })),
    }),
    {
      name: 'game-storage',
    }
  )
)