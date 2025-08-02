'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LeaderboardService } from './leaderboard-service'
import {
  LeaderboardCategory,
  LeaderboardData,
  LeaderboardStats,
  LeaderboardFilter
} from './types'

interface LeaderboardContextType {
  leaderboardData: LeaderboardData | null
  leaderboardStats: LeaderboardStats | null
  currentFilter: LeaderboardFilter
  isLoading: boolean
  error: string | null
  setFilter: (filter: LeaderboardFilter) => void
  refreshLeaderboard: () => Promise<void>
  updateUserScore: (category: LeaderboardCategory, scoreIncrease: number) => Promise<void>
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined)

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [leaderboardStats, setLeaderboardStats] = useState<LeaderboardStats | null>(null)
  const [currentFilter, setCurrentFilter] = useState<LeaderboardFilter>({
    category: 'overall',
    timeFrame: 'weekly'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const leaderboardService = LeaderboardService.getInstance()

  // 리더보드 데이터 로드
  const loadLeaderboard = async() => {
    setIsLoading(true)
    setError(null)

    try {
      const [data, stats] = await Promise.all([
        leaderboardService.getLeaderboard(currentFilter),
        leaderboardService.getLeaderboardStats()
      ])

      setLeaderboardData(data)
      setLeaderboardStats(stats)
    } catch (err) {
      setError('리더보드를 불러오는데 실패했습니다')
      console.error('Failed to load leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 필터 변경
  const setFilter = (filter: LeaderboardFilter) => {
    setCurrentFilter(filter)
  }

  // 리더보드 새로고침
  const refreshLeaderboard = async() => {
    await loadLeaderboard()
  }

  // 사용자 점수 업데이트
  const updateUserScore = async(category: LeaderboardCategory, scoreIncrease: number) => {
    try {
      await leaderboardService.updateUserScore('default-user', category, scoreIncrease)
      // 점수 업데이트 후 리더보드 새로고침
      await loadLeaderboard()
    } catch (err) {
      console.error('Failed to update user score:', err)
    }
  }

  // 필터 변경시 리더보드 재로드
  useEffect(() => {
    loadLeaderboard()
  }, [currentFilter])

  const value: LeaderboardContextType = {
    leaderboardData,
    leaderboardStats,
    currentFilter,
    isLoading,
    error,
    setFilter,
    refreshLeaderboard,
    updateUserScore
  }

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  )
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext)
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider')
  }
  return context
}
