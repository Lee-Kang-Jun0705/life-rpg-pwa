'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { RankingEntry, RankingFilter, UserRankingStats } from '@/lib/types/ranking'
import { rankingService } from '@/lib/services/ranking-service'
import { CURRENT_SEASON } from '@/lib/ranking/ranking-data'
import { RankingCard } from '@/components/ranking/RankingCard'
import { RankingFilters } from '@/components/ranking/RankingFilters'
import { UserRankingStats as UserRankingStatsComponent } from '@/components/ranking/UserRankingStats'
import { SeasonInfo } from '@/components/ranking/SeasonInfo'
import { Trophy, TrendingUp, Users, Search, RefreshCw, Medal, Target } from 'lucide-react'

const GAME_CONFIG = {
  DEFAULT_USER_ID: 'current-user'
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [userStats, setUserStats] = useState<UserRankingStats | null>(null)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchResults, setSearchResults] = useState<RankingEntry[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'ranking' | 'mystats'>('mystats')

  const [filter, setFilter] = useState<RankingFilter>({
    category: 'total_level',
    period: 'weekly'
  })

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  const loadData = useCallback(async() => {
    try {
      setLoading(true)

      // 랭킹 데이터 로드
      const rankingData = await rankingService.getRanking(filter)
      setRankings(rankingData)

      // 사용자 통계 로드
      const stats = await rankingService.getUserRankingStats(GAME_CONFIG.DEFAULT_USER_ID)
      setUserStats(stats)

      // 사용자 순위 조회
      const userRank = await rankingService.getUserRank(GAME_CONFIG.DEFAULT_USER_ID, filter.category, filter.period)
      setCurrentUserRank(userRank?.rank || null)

    } catch (error) {
      console.error('Failed to load ranking data:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  // 필터 변경
  const handleFilterChange = (newFilter: Partial<RankingFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
    setIsSearching(false)
    setSearchResults([])
  }

  // 검색
  const handleSearch = async(query: string) => {
    if (!query.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    try {
      const results = await rankingService.searchUser(query)
      setSearchResults(results)
      setIsSearching(true)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  // 새로고침
  const handleRefresh = async() => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const displayRankings = isSearching ? searchResults : rankings
  const currentUser = displayRankings.find(entry => entry.userId === GAME_CONFIG.DEFAULT_USER_ID)

  if (loading && !userStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">랭킹 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">내 기록</h1>
                <p className="text-gray-600 dark:text-gray-400">나의 성장 기록을 확인해보세요</p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 개인 기록만 표시하므로 탭 숨김 */}
        </motion.div>

        {/* 개인 기록 표시 */}
        <div className="max-w-4xl mx-auto">
          {userStats && (
            <UserRankingStatsComponent
              stats={userStats}
              userRank={currentUserRank || undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
