import { useState, useEffect, useCallback } from 'react'
import { TimeRestrictionService, type TimeActivityState, type TimeActivityStats } from './time-restriction-service'
import type { StatType } from '@/lib/types/game-common'
import { db } from '@/lib/database'
import { STATS_CONFIG } from '@/lib/config/game-config'

interface UseTimeRestrictionsReturn {
  timeState: TimeActivityState | null
  isLoading: boolean
  error: Error | null
  refreshTimeState: () => void
  getTimeStats: () => Promise<TimeActivityStats | null>
  checkIfGoodTime: (statType?: StatType) => boolean
  findNextGoodTime: (statType?: StatType) => { hour: number; name: string; bonus: boolean } | null
}

export function useTimeRestrictions(userId: string, statType?: StatType): UseTimeRestrictionsReturn {
  const [timeState, setTimeState] = useState<TimeActivityState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const timeService = TimeRestrictionService.getInstance()

  const refreshTimeState = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)

      const state = timeService.getCurrentTimeState(statType)
      setTimeState(state)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get time state'))
    } finally {
      setIsLoading(false)
    }
  }, [statType, timeService])

  const getTimeStats = useCallback(async(): Promise<TimeActivityStats | null> => {
    if (!userId) {
      return null
    }

    try {
      // 최근 활동 데이터 가져오기
      const activityHistoryDate = new Date()
      activityHistoryDate.setDate(activityHistoryDate.getDate() - STATS_CONFIG.ACTIVITY_HISTORY_DAYS)

      const activities = await db.activities
        .where('userId')
        .equals(userId)
        .and(activity => activity.timestamp >= activityHistoryDate)
        .toArray()

      const stats = await timeService.analyzeTimeActivityPatterns(userId, activities)
      return stats
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get time stats'))
      return null
    }
  }, [userId, timeService])

  const checkIfGoodTime = useCallback((checkStatType?: StatType): boolean => {
    return timeService.isGoodTimeForActivity(undefined, checkStatType || statType)
  }, [statType, timeService])

  const findNextGoodTime = useCallback((checkStatType?: StatType): { hour: number; name: string; bonus: boolean } | null => {
    return timeService.findNextGoodTime(checkStatType || statType)
  }, [statType, timeService])

  // 초기 로드
  useEffect(() => {
    refreshTimeState()
  }, [refreshTimeState])

  // 1분마다 시간 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTimeState()
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshTimeState])

  return {
    timeState,
    isLoading,
    error,
    refreshTimeState,
    getTimeStats,
    checkIfGoodTime,
    findNextGoodTime
  }
}
