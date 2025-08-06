import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Item } from '@/lib/types/dungeon'

interface DungeonStore {
  // 골드
  gold: number
  totalGoldEarned: number
  
  // 인벤토리
  inventory: Item[]
  equippedItems: {
    weapon: Item | null
    armor: Item | null
    accessory: Item | null
  }
  
  // 진행 상황
  highestStage: {
    normal: number
    elite: number
    boss: number
    infinite: number
  }
  
  // 통계
  statistics: {
    monstersDefeated: number
    totalDamageDealt: number
    totalDamageTaken: number
    itemsCollected: number
  }
  
  // 액션
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  addItem: (item: Item) => void
  removeItem: (itemId: string) => void
  equipItem: (item: Item) => void
  unequipItem: (slot: 'weapon' | 'armor' | 'accessory') => void
  updateHighestStage: (dungeonType: keyof DungeonStore['highestStage'], stage: number) => void
  updateStatistics: (stats: Partial<DungeonStore['statistics']>) => void
  reset: () => void
}

const initialState = {
  gold: 0,
  totalGoldEarned: 0,
  inventory: [],
  equippedItems: {
    weapon: null,
    armor: null,
    accessory: null
  },
  highestStage: {
    normal: 0,
    elite: 0,
    boss: 0,
    infinite: 0
  },
  statistics: {
    monstersDefeated: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    itemsCollected: 0
  }
}

export const useDungeonStore = create<DungeonStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addGold: (amount: number) => {
        set(state => ({
          gold: state.gold + amount,
          totalGoldEarned: state.totalGoldEarned + amount
        }))
      },
      
      spendGold: (amount: number) => {
        const currentGold = get().gold
        if (currentGold >= amount) {
          set(state => ({ gold: state.gold - amount }))
          return true
        }
        return false
      },
      
      addItem: (item: Item) => {
        set(state => ({
          inventory: [...state.inventory, item],
          statistics: {
            ...state.statistics,
            itemsCollected: state.statistics.itemsCollected + 1
          }
        }))
      },
      
      removeItem: (itemId: string) => {
        set(state => ({
          inventory: state.inventory.filter(item => item.id !== itemId)
        }))
      },
      
      equipItem: (item: Item) => {
        set(state => {
          // 현재 장착된 아이템을 인벤토리로
          const currentEquipped = state.equippedItems[item.type]
          const newInventory = [...state.inventory]
          
          if (currentEquipped) {
            newInventory.push(currentEquipped)
          }
          
          // 새 아이템 장착
          return {
            inventory: newInventory.filter(i => i.id !== item.id),
            equippedItems: {
              ...state.equippedItems,
              [item.type]: item
            }
          }
        })
      },
      
      unequipItem: (slot: 'weapon' | 'armor' | 'accessory') => {
        set(state => {
          const item = state.equippedItems[slot]
          if (!item) return state
          
          return {
            inventory: [...state.inventory, item],
            equippedItems: {
              ...state.equippedItems,
              [slot]: null
            }
          }
        })
      },
      
      updateHighestStage: (dungeonType: keyof DungeonStore['highestStage'], stage: number) => {
        set(state => ({
          highestStage: {
            ...state.highestStage,
            [dungeonType]: Math.max(state.highestStage[dungeonType], stage)
          }
        }))
      },
      
      updateStatistics: (stats: Partial<DungeonStore['statistics']>) => {
        set(state => ({
          statistics: {
            ...state.statistics,
            ...stats
          }
        }))
      },
      
      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'dungeon-storage',
      version: 1
    }
  )
)