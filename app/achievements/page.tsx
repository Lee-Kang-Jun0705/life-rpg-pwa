'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AchievementService } from '@/lib/achievements/achievement-service'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_DIFFICULTIES } from '@/lib/achievements/achievement-data'
import type { 
  AchievementSystemState, 
  AchievementFilter, 
  AchievementSortOption,
  AchievementCategory,
  AchievementDifficulty
} from '@/lib/types/achievements'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import { AchievementStats } from '@/components/achievements/AchievementStats'
import { AchievementNotifications } from '@/components/achievements/AchievementNotifications'
import { motion } from 'framer-motion'
import { Trophy, Search, Filter, Bell, Star } from 'lucide-react'

export default function AchievementsPage() {
  const [achievementState, setAchievementState] = useState<AchievementSystemState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all')
  
  // 필터 및 정렬
  const [filter, setFilter] = useState<AchievementFilter>({})
  const [sortBy, setSortBy] = useState<AchievementSortOption>('category')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const achievementService = AchievementService.getInstance()

  const loadAchievementData = useCallback(async () => {
    try {
      setIsLoading(true)
      const state = await achievementService.initializeAchievements(GAME_CONFIG.DEFAULT_USER_ID)
      
      // 임시로 일부 업적 달성 상태 설정
      if (state.achievements['first-steps']) {
        state.achievements['first-steps'].isUnlocked = true
        state.achievements['first-steps'].unlockedAt = new Date()
      }
      if (state.achievements['rookie-fighter']) {
        state.achievements['rookie-fighter'].isUnlocked = true
        state.achievements['rookie-fighter'].unlockedAt = new Date()
      }
      if (state.progress['slime-slayer']) {
        state.progress['slime-slayer'].current = 23
        state.progress['slime-slayer'].percentage = 46
      }
      if (state.progress['level-up-master']) {
        state.progress['level-up-master'].current = 7
        state.progress['level-up-master'].percentage = 70
      }
      
      setAchievementState(state)
    } catch (error) {
      console.error('Failed to load achievement data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [achievementService])

  // 초기 데이터 로드
  useEffect(() => {
    loadAchievementData()
  }, [loadAchievementData])

  if (isLoading || !achievementState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  // 필터링 및 정렬
  const filteredAchievements = achievementService.filterAndSortAchievements(
    achievementState.achievements,
    { 
      ...filter, 
      searchQuery,
      unlocked: activeTab === 'unlocked' ? true : activeTab === 'locked' ? false : undefined
    },
    sortBy,
    achievementState.progress
  )

  // 미읽은 알림 수
  const unreadNotifications = achievementState.notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                업적
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                다양한 도전과제를 완료하고 보상을 획득하세요
              </p>
            </div>
            
            {/* 알림 버튼 */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 통계 */}
        <AchievementStats stats={achievementState.stats} />

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Trophy className="w-4 h-4" />
            전체 ({Object.keys(achievementState.achievements).length})
          </button>
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'unlocked'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Star className="w-4 h-4" />
            달성 ({achievementState.stats.unlockedAchievements})
          </button>
          <button
            onClick={() => setActiveTab('locked')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'locked'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            미달성 ({achievementState.stats.totalAchievements - achievementState.stats.unlockedAchievements})
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="업적 이름으로 검색..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 필터 및 정렬 옵션 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                필터
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as AchievementSortOption)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <option value="category">카테고리순</option>
                <option value="name">이름순</option>
                <option value="difficulty">난이도순</option>
                <option value="progress">진행도순</option>
                <option value="unlock_date">달성순</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              {filteredAchievements.length}개 표시
            </div>
          </div>

          {/* 필터 패널 */}
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">카테고리</h4>
                  <div className="space-y-2">
                    {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, category]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filter.category?.includes(key as AchievementCategory) || false}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...(filter.category || []), key as AchievementCategory]
                              : filter.category?.filter(c => c !== key) || []
                            setFilter({
                              ...filter,
                              category: newCategories.length > 0 ? newCategories : undefined
                            })
                          }}
                        />
                        <span className="mr-1">{category.icon}</span>
                        {category.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">난이도</h4>
                  <div className="space-y-2">
                    {Object.entries(ACHIEVEMENT_DIFFICULTIES).map(([key, difficulty]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filter.difficulty?.includes(key as AchievementDifficulty) || false}
                          onChange={(e) => {
                            const newDifficulties = e.target.checked
                              ? [...(filter.difficulty || []), key as AchievementDifficulty]
                              : filter.difficulty?.filter(d => d !== key) || []
                            setFilter({
                              ...filter,
                              difficulty: newDifficulties.length > 0 ? newDifficulties : undefined
                            })
                          }}
                        />
                        {difficulty.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filter.hidden === true}
                    onChange={(e) => setFilter({
                      ...filter,
                      hidden: e.target.checked ? true : undefined
                    })}
                  />
                  숨겨진 업적 표시
                </label>
              </div>

              <button
                onClick={() => setFilter({})}
                className="text-sm text-purple-500 hover:text-purple-600"
              >
                필터 초기화
              </button>
            </motion.div>
          )}
        </div>

        {/* 업적 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement, index) => {
            const progress = achievementState.progress[achievement.id]
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <AchievementCard
                  achievement={achievement}
                  progress={progress}
                />
              </motion.div>
            )
          })}
        </div>

        {/* 업적이 없는 경우 */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              업적이 없습니다
            </h3>
            <p className="text-gray-500">
              다른 필터를 시도해보세요
            </p>
          </div>
        )}

        {/* 알림 모달 */}
        {showNotifications && (
          <AchievementNotifications
            notifications={achievementState.notifications}
            achievements={achievementState.achievements}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={(id) => achievementService.markNotificationAsRead(GAME_CONFIG.DEFAULT_USER_ID, id)}
            onMarkAllAsRead={() => achievementService.markAllNotificationsAsRead(GAME_CONFIG.DEFAULT_USER_ID)}
          />
        )}
      </div>
    </div>
  )
}