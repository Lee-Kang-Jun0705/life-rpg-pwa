import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Activity } from '@/lib/database/types'
import { dbHelpers } from '@/lib/database/client'
import { STAT_TYPES, GAME_CONFIG } from '@/lib/types/dashboard'

interface ActivitySummaryProps {
  totalActivities: number
}

export const ActivitySummary = React.memo(function ActivitySummary({ totalActivities }: ActivitySummaryProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('📊 ActivitySummary: totalActivities changed to', totalActivities)
    const loadActivities = async() => {
      try {
        setIsLoading(true)
        const allActivities = await dbHelpers.getActivities(GAME_CONFIG.DEFAULT_USER_ID)
        console.log('📊 ActivitySummary: loaded activities', allActivities.length)
        setActivities(allActivities)
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [totalActivities])

  // activity-added 이벤트 리스너 추가
  useEffect(() => {
    const handleActivityAdded = async () => {
      console.log('📊 ActivitySummary: activity-added event received')
      const allActivities = await dbHelpers.getActivities(GAME_CONFIG.DEFAULT_USER_ID)
      setActivities(allActivities)
    }

    window.addEventListener('activity-added', handleActivityAdded)
    
    return () => {
      window.removeEventListener('activity-added', handleActivityAdded)
    }
  }, [])

  // 오늘의 활동 필터링
  const todayActivities = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === today.getTime()
    })
  }, [activities])

  // 스탯별 최근 활동
  const statRecentActivities = useMemo(() => {
    const recentByType: { [key: string]: Activity | null } = {}

    STAT_TYPES.forEach(stat => {
      const statActivities = activities.filter(a => a.statType === stat.type)
      recentByType[stat.type] = statActivities.length > 0 ? statActivities[0] : null
    })

    return recentByType
  }, [activities])

  const getStatEmoji = (statType: string) => {
    const stat = STAT_TYPES.find(s => s.type === statType)
    return stat?.emoji || '🎯'
  }

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) {
      return '방금'
    }
    if (minutes < 60) {
      return `${minutes}분`
    }
    if (hours < 24) {
      return `${hours}시간`
    }
    return '어제'
  }

  const getActivityEmoji = (activityName: string) => {
    const emojiMap: { [key: string]: string } = {
      '운동하기': '🏃',
      '산책하기': '🚶',
      '물 마시기': '💧',
      '건강식 먹기': '🥗',
      '스트레칭': '🧘',
      '충분한 수면': '😴',
      '책 읽기': '📖',
      '복습하기': '📝',
      '강의 듣기': '🎧',
      '문제 풀기': '✏️',
      '정리하기': '📋',
      '노트 작성': '📓',
      '안부 인사': '👋',
      '친구 만나기': '👥',
      '가족 시간': '👨‍👩‍👧‍👦',
      '선물하기': '🎁',
      '감사 표현': '💝',
      '함께 식사': '🍽️',
      '목표 설정': '🎯',
      '일정 정리': '📅',
      '업무 집중': '💼',
      '성과 기록': '📊',
      '계획 수립': '📝',
      '회고하기': '🤔'
    }
    return emojiMap[activityName] || '✨'
  }

  if (isLoading) {
    return (
      <div className="mt-6 mb-20">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 md:mt-6 mb-20">
      {/* 오늘의 활동 요약 */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-4 md:p-6">
        {/* 헤더 섹션 */}
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <span className="text-2xl md:text-3xl animate-bounce">📅</span>
          <div>
            <h3 className="text-base md:text-lg font-bold">오늘의 활동</h3>
            <span className="text-sm md:text-base font-medium text-primary">{todayActivities.length}개 완료</span>
          </div>
        </div>

        {/* 스탯별 최근 활동 - 2x2 그리드 - 크기 증가 */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {STAT_TYPES.map(stat => {
            const recentActivity = statRecentActivities[stat.type]

            return (
              <motion.div
                key={stat.type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 md:p-3"
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xl md:text-2xl">{stat.emoji}</span>
                  {recentActivity ? (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <span className="text-lg md:text-xl">{getActivityEmoji(recentActivity.activityName)}</span>
                        <span className="text-xs md:text-sm text-gray-500 truncate">
                          {getRelativeTime(recentActivity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs md:text-sm text-gray-400 italic">-</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 최근 활동 - 좌우 분할 레이아웃 - 크기 대폭 증가 */}
        {activities.length > 0 ? (
          <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4">최근 활동</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activities.slice(0, 4).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] ${
                    activity.statType === 'health' ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20' :
                      activity.statType === 'learning' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20' :
                        activity.statType === 'relationship' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                          'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* 활동 아이콘 - 매우 크게 */}
                    <div className="text-5xl">
                      {getActivityEmoji(activity.activityName)}
                    </div>

                    {/* 활동 정보 */}
                    <div>
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-200 block">
                        {activity.activityName}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">{getStatEmoji(activity.statType)}</span>
                        <span className="text-base text-gray-500 dark:text-gray-400">
                          {getRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 경험치 - 크게 표시 */}
                  <div className="text-right">
                    <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      +{activity.experience}
                    </span>
                    <span className="text-base text-gray-500 dark:text-gray-400 block">
                      EXP
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 더보기 버튼 - 왼쪽 정렬 */}
            {activities.length > 4 && (
              <div className="mt-6">
                <Link
                  href="/activities"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:shadow-lg transition-all hover:scale-105"
                >
                  <span>모든 활동 보기</span>
                  <span className="text-xl">→</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="text-center py-12">
              <span className="text-7xl mb-4 block animate-bounce">🌟</span>
              <h4 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                첫 활동을 시작해보세요!
              </h4>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
                위의 스탯 버튼을 눌러 활동을 기록하세요
              </p>
              <div className="inline-flex items-center gap-3 text-base text-gray-400">
                <span className="text-2xl">👆</span>
                <span>스탯 카드를 터치하세요</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
