import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Stat, Activity, UserProfile } from '@/lib/types'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG, generateRandomExperience, calculateLevel } from '@/lib/types/dashboard'

// 스토어 상태 타입 정의
interface DashboardSlice {
  stats: Stat[]
  loading: boolean
  error: string | null
  isProcessing: Set<string>
  loadUserData: () => Promise<void>
  handleStatClick: (statType: string) => Promise<void>
  handleVoiceInput: (transcript: string, activityType?: string | null) => Promise<void>
  updateStatOptimistically: (statType: string, experience: number) => boolean
}

interface ProfileSlice {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  loadProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

interface UISlice {
  theme: 'light' | 'dark' | 'system'
  isOffline: boolean
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setOfflineStatus: (status: boolean) => void
  addNotification: (notification: Omit<UISlice['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
}

// 통합 스토어 타입
export interface AppStore extends DashboardSlice, ProfileSlice, UISlice {}

// 통합 스토어 생성
export const useStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Dashboard Slice
        stats: [],
        loading: true,
        error: null,
        isProcessing: new Set(),
        
        loadUserData: async () => {
          set((state) => {
            state.loading = true
            state.error = null
          })
          
          try {
            const profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
            
            if (!profile) {
              await dbHelpers.initializeUserData(
                GAME_CONFIG.DEFAULT_USER_ID,
                GAME_CONFIG.DEFAULT_USER_EMAIL,
                GAME_CONFIG.DEFAULT_USER_NAME
              )
            }
            
            const userStats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
            
            set((state) => {
              state.stats = userStats || []
              state.loading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : '데이터 로드 실패'
              state.loading = false
            })
          }
        },
        
        updateStatOptimistically: (statType: string, experience: number) => {
          let hasLevelUp = false
          
          set((state) => {
            const statIndex = state.stats.findIndex(s => s.type === statType)
            if (statIndex !== -1) {
              const stat = state.stats[statIndex]
              const newExperience = (stat.experience || 0) + experience
              const { level: newLevel } = calculateLevel(newExperience)
              
              if (newLevel > (stat.level || 1)) {
                hasLevelUp = true
              }
              
              state.stats[statIndex] = {
                ...stat,
                experience: newExperience,
                level: newLevel,
                totalActivities: (stat.totalActivities || 0) + 1,
                updatedAt: new Date()
              }
            }
          })
          
          return hasLevelUp
        },
        
        handleStatClick: async (statType: string) => {
          if (get().isProcessing.has(statType)) return
          
          set((state) => {
            state.isProcessing.add(statType)
          })
          
          try {
            const experience = generateRandomExperience()
            get().updateStatOptimistically(statType, experience)
            
            await dbHelpers.addActivity({
              userId: GAME_CONFIG.DEFAULT_USER_ID,
              statType: statType as Stat['type'],
              activityName: '활동 기록',
              experience,
              timestamp: new Date()
            })
          } catch (error) {
            console.error('Stat update failed:', error)
            await get().loadUserData() // 실패 시 데이터 다시 로드
          } finally {
            set((state) => {
              state.isProcessing.delete(statType)
            })
          }
        },
        
        handleVoiceInput: async (transcript: string, activityType?: string | null) => {
          const statType = activityType || 'achievement'
          await get().handleStatClick(statType)
        },
        
        // Profile Slice
        profile: null,
        isLoading: false,
        
        loadProfile: async () => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })
          
          try {
            const profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
            set((state) => {
              state.profile = profile || null
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : '프로필 로드 실패'
              state.isLoading = false
            })
          }
        },
        
        updateProfile: async (updates: Partial<UserProfile>) => {
          try {
            await dbHelpers.updateProfile(GAME_CONFIG.DEFAULT_USER_ID, updates)
            await get().loadProfile()
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : '프로필 업데이트 실패'
            })
          }
        },
        
        // UI Slice
        theme: 'system',
        isOffline: false,
        notifications: [],
        
        setTheme: (theme) => {
          set((state) => {
            state.theme = theme
          })
        },
        
        setOfflineStatus: (status) => {
          set((state) => {
            state.isOffline = status
          })
        },
        
        addNotification: (notification) => {
          const id = Date.now().toString()
          set((state) => {
            state.notifications.push({ ...notification, id })
          })
          
          // 5초 후 자동 제거
          setTimeout(() => {
            get().removeNotification(id)
          }, 5000)
        },
        
        removeNotification: (id) => {
          set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== id)
          })
        }
      })),
      {
        name: 'life-rpg-store',
        partialize: (state) => ({
          theme: state.theme,
          profile: state.profile
        })
      }
    )
  )
)

// 선택자 훅들
export const useStats = () => useStore((state) => state.stats)
export const useProfile = () => useStore((state) => state.profile)
export const useTheme = () => useStore((state) => state.theme)
export const useNotifications = () => useStore((state) => state.notifications)
export const useOfflineStatus = () => useStore((state) => state.isOffline)