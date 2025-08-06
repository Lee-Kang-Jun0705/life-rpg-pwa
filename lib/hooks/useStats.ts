import { useState, useEffect, useCallback } from 'react'
import { dbHelpers } from '@/lib/database/client'
import type { Stat } from '@/lib/database/types'
import { DUNGEON_CONFIG } from '@/lib/constants/dungeon'

interface UseStatsReturn {
  stats: Stat[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 기본 스탯 생성 함수
const createDefaultStats = (userId: string): Stat[] => [
  { userId, type: 'health', level: 0, experience: 0, totalActivities: 0, updatedAt: new Date() },
  { userId, type: 'learning', level: 0, experience: 0, totalActivities: 0, updatedAt: new Date() },
  { userId, type: 'relationship', level: 0, experience: 0, totalActivities: 0, updatedAt: new Date() },
  { userId, type: 'achievement', level: 0, experience: 0, totalActivities: 0, updatedAt: new Date() }
]

/**
 * 사용자 스탯을 관리하는 Custom Hook
 * @param userId - 사용자 ID (optional)
 * @returns 스탯 데이터와 상태
 */
export function useStats(userId?: string): UseStatsReturn {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // userId가 없으면 기본값 사용
      const currentUserId = userId || DUNGEON_CONFIG.DEFAULT_USER_ID
      
      const userStats = await dbHelpers.getStats(currentUserId)
      
      // 스탯이 없으면 기본 스탯 생성
      if (!userStats || userStats.length === 0) {
        const defaultStats = createDefaultStats(currentUserId)
        setStats(defaultStats)
        
        // 기본 스탯을 DB에 저장 시도 (실패해도 계속 진행)
        try {
          await Promise.all(
            defaultStats.map(stat => 
              dbHelpers.updateStat(currentUserId, stat.type, stat.level, stat.experience)
            )
          )
        } catch (saveError) {
          // 저장 실패는 무시하고 진행
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to save default stats:', saveError)
          }
        }
      } else {
        setStats(userStats)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스탯을 불러오는데 실패했습니다'
      setError(errorMessage)
      
      // 에러 발생 시에도 기본 스탯 제공
      const currentUserId = userId || DUNGEON_CONFIG.DEFAULT_USER_ID
      setStats(createDefaultStats(currentUserId))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  }
}