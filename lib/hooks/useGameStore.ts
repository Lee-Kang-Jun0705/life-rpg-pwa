/**
 * Game Store React Hooks
 * 중앙 게임 스토어와 React 컴포넌트를 연결
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { gameStore, type GameState } from '@/lib/store/game-store'
import { GAME_CONFIG } from '@/lib/config/game-config'
import type { StatType } from '@/lib/types/dashboard'

/**
 * 특정 상태 슬라이스 구독
 */
export function useGameStore<T extends keyof GameState>(
  slice: T | T[]
): GameState[T] | Pick<GameState, T[number]> {
  const slices = Array.isArray(slice) ? slice : [slice]
  const [state, setState] = useState(() => {
    if (Array.isArray(slice)) {
      const result: any = {}
      slices.forEach(s => {
        result[s] = gameStore.getState(s)
      })
      return result
    }
    return gameStore.getState(slice as T)
  })

  useEffect(() => {
    // 초기 상태 설정
    if (Array.isArray(slice)) {
      const result: any = {}
      slices.forEach(s => {
        result[s] = gameStore.getState(s)
      })
      setState(result)
    } else {
      setState(gameStore.getState(slice as T))
    }

    // 구독
    const unsubscribe = gameStore.subscribe(slices, () => {
      if (Array.isArray(slice)) {
        const result: any = {}
        slices.forEach(s => {
          result[s] = gameStore.getState(s)
        })
        setState(result)
      } else {
        setState(gameStore.getState(slice as T))
      }
    })

    return unsubscribe
  }, [slice, slices])

  return state
}

/**
 * 프로필 데이터 훅
 */
export function useProfile() {
  const profile = useGameStore('profile')
  const isLoading = useGameStore('isLoading')
  const error = useGameStore('error')

  const initializeProfile = useCallback(async (userId: string = GAME_CONFIG.DEFAULT_USER_ID) => {
    await gameStore.initialize(userId)
  }, [])

  return {
    profile,
    isLoading,
    error,
    initializeProfile
  }
}

/**
 * 스탯 데이터 훅
 */
export function useStats() {
  const stats = useGameStore('stats')
  const processingStats = useRef(new Set<string>())
  const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set())

  const updateStat = useCallback(async (
    statType: StatType, 
    experience: number, 
    activityName: string
  ) => {
    if (processingStats.current.has(statType)) {
      console.warn(`Stat ${statType} is already being processed`)
      return
    }

    processingStats.current.add(statType)
    setIsProcessing(new Set(processingStats.current))

    try {
      await gameStore.updateExperience(statType, experience, activityName)
    } finally {
      processingStats.current.delete(statType)
      setIsProcessing(new Set(processingStats.current))
    }
  }, [])

  return {
    stats,
    isProcessing,
    updateStat
  }
}

/**
 * 전투 스탯 훅
 */
export function useCombatStats() {
  const combat = useGameStore('combat')

  const heal = useCallback(async (type: 'hp' | 'mp', amount: number) => {
    await gameStore.heal(type, amount)
  }, [])

  return {
    ...combat,
    heal
  }
}

/**
 * 전체 게임 상태 훅
 */
export function useGameState() {
  const [state, setState] = useState(gameStore.getAllState())

  useEffect(() => {
    // 모든 슬라이스 구독
    const slices: (keyof GameState)[] = ['profile', 'stats', 'combat', 'isLoading', 'error']
    const unsubscribe = gameStore.subscribe(slices, () => {
      setState(gameStore.getAllState())
    })

    return unsubscribe
  }, [])

  const initializeGame = useCallback(async (userId: string = GAME_CONFIG.DEFAULT_USER_ID) => {
    await gameStore.initialize(userId)
  }, [])

  const refreshData = useCallback(async () => {
    await gameStore.refreshFromDatabase()
  }, [])

  return {
    ...state,
    initializeGame,
    refreshData
  }
}

/**
 * 대시보드 호환 훅
 * 기존 useDashboard와 유사한 인터페이스 제공
 */
export function useGameDashboard() {
  const { profile, stats, isLoading: loading, error } = useGameState()
  const { updateStat } = useStats()
  const initializeCalled = useRef(false)

  // 초기화
  useEffect(() => {
    if (!initializeCalled.current) {
      initializeCalled.current = true
      gameStore.initialize(GAME_CONFIG.DEFAULT_USER_ID)
    }
  }, [])

  const handleStatClick = useCallback(async (statType: string) => {
    const experience = Math.floor(
      Math.random() * (GAME_CONFIG.MAX_EXPERIENCE_GAIN - GAME_CONFIG.MIN_EXPERIENCE_GAIN + 1)
    ) + GAME_CONFIG.MIN_EXPERIENCE_GAIN
    
    await updateStat(statType as StatType, experience, '직접 활동')
  }, [updateStat])

  const handleStatAction = useCallback(async (statType: string, action: string) => {
    const experience = Math.floor(
      Math.random() * (GAME_CONFIG.MAX_EXPERIENCE_GAIN - GAME_CONFIG.MIN_EXPERIENCE_GAIN + 1)
    ) + GAME_CONFIG.MIN_EXPERIENCE_GAIN
    
    await updateStat(statType as StatType, experience, action)
  }, [updateStat])

  // 계산된 통계
  const calculatedStats = {
    totalLevel: profile?.level || 1,
    totalExp: profile?.totalExperience || 0,
    totalActivities: Object.values(stats).reduce((sum, stat) => sum + stat.activities, 0),
    maxLevel: Math.max(...Object.values(stats).map(s => s.level))
  }

  // 기존 useDashboard와 호환되는 형태로 스탯 변환
  const dashboardStats = Object.entries(stats).map(([type, stat]) => ({
    id: undefined,
    userId: GAME_CONFIG.DEFAULT_USER_ID,
    type: type as StatType,
    level: stat.level,
    experience: stat.experience,
    totalActivities: stat.activities,
    updatedAt: new Date()
  }))

  return {
    stats: dashboardStats,
    loading,
    error,
    isProcessing: new Set<string>(),
    loadUserData: async () => gameStore.refreshFromDatabase(),
    handleStatClick,
    handleVoiceInput: async () => {}, // 별도 구현 필요
    handleStatAction,
    retry: async () => gameStore.refreshFromDatabase(),
    updateStat,
    calculatedStats
  }
}