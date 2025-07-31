import { useState, useEffect, useCallback } from 'react'
import { FatigueService, type FatigueState, type FatigueStatistics } from './fatigue-service'
import type { Result } from '@/lib/types/experience'

interface UseFatigueReturn {
  fatigueState: FatigueState | null
  isLoading: boolean
  error: Error | null
  refreshFatigue: () => Promise<void>
  recordRest: (duration: number) => Promise<boolean>
  getFatigueStats: (days?: number) => Promise<FatigueStatistics | null>
}

export function useFatigue(userId: string): UseFatigueReturn {
  const [fatigueState, setFatigueState] = useState<FatigueState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fatigueService = FatigueService.getInstance()

  const refreshFatigue = useCallback(async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const result = await fatigueService.getFatigueState(userId)
      
      if (result.success) {
        setFatigueState(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load fatigue state'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const recordRest = useCallback(async (duration: number): Promise<boolean> => {
    if (!userId) return false

    try {
      const result = await fatigueService.recordRest(userId, duration)
      
      if (result.success) {
        setFatigueState(result.data)
        return true
      } else {
        setError(result.error)
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to record rest'))
      return false
    }
  }, [userId])

  const getFatigueStats = useCallback(async (days: number = 7): Promise<FatigueStatistics | null> => {
    if (!userId) return null

    try {
      const result = await fatigueService.getFatigueStats(userId, days)
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error)
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get fatigue stats'))
      return null
    }
  }, [userId])

  // 초기 로드
  useEffect(() => {
    refreshFatigue()
  }, [refreshFatigue])

  // 주기적으로 피로도 상태 업데이트 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFatigue()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshFatigue])

  return {
    fatigueState,
    isLoading,
    error,
    refreshFatigue,
    recordRest,
    getFatigueStats
  }
}