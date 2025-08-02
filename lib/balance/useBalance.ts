import { useState, useEffect, useCallback } from 'react'
import { BalanceService, type BalanceState, type BalanceStatistics, type BalanceBonus } from './balance-service'
import type { Result } from '@/lib/types/experience'
import type { StatType } from '@/lib/types/game-common'

interface UseBalanceReturn {
  balanceState: BalanceState | null
  isLoading: boolean
  error: Error | null
  refreshBalance: () => Promise<void>
  getBalanceBonus: (statType: StatType) => Promise<BalanceBonus | null>
  getBalanceStats: (days?: number) => Promise<BalanceStatistics | null>
}

export function useBalance(userId: string): UseBalanceReturn {
  const [balanceState, setBalanceState] = useState<BalanceState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const balanceService = BalanceService.getInstance()

  const refreshBalance = useCallback(async() => {
    if (!userId) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await balanceService.getBalanceState(userId)

      if (result.success) {
        setBalanceState(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load balance state'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const getBalanceBonus = useCallback(async(statType: StatType): Promise<BalanceBonus | null> => {
    if (!userId) {
      return null
    }

    try {
      const result = await balanceService.calculateBalanceBonus(userId, statType)

      if (result.success) {
        return result.data
      } else {
        setError(result.error)
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get balance bonus'))
      return null
    }
  }, [userId])

  const getBalanceStats = useCallback(async(days = 30): Promise<BalanceStatistics | null> => {
    if (!userId) {
      return null
    }

    try {
      const result = await balanceService.getBalanceStatistics(userId, days)

      if (result.success) {
        return result.data
      } else {
        setError(result.error)
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get balance statistics'))
      return null
    }
  }, [userId])

  // 초기 로드
  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  // 활동 후 균형 상태 업데이트 (10분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshBalance])

  return {
    balanceState,
    isLoading,
    error,
    refreshBalance,
    getBalanceBonus,
    getBalanceStats
  }
}
