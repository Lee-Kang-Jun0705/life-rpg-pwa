'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { Activity } from '@/lib/database/types'
import { dbHelpers } from '@/lib/database/client'
import { STAT_TYPES, GAME_CONFIG } from '@/lib/types/dashboard'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isYesterday } from 'date-fns'
import { ko } from 'date-fns/locale'

type ViewMode = 'today' | 'week' | 'month' | 'all'
type StatFilter = 'all' | string

export default function ActivitiesClient() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('today')
  const [statFilter, setStatFilter] = useState<StatFilter>('all')

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true)
        const allActivities = await dbHelpers.getActivities(GAME_CONFIG.DEFAULT_USER_ID)
        setActivities(allActivities)
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
  }, [])

  // 필터링된 활동
  const filteredActivities = useMemo(() => {
    let filtered = [...activities]

    // 스탯 필터
    if (statFilter !== 'all') {
      filtered = filtered.filter(a => a.statType === statFilter)
    }

    // 시간 필터
    const now = new Date()
    switch (viewMode) {
      case 'today':
        filtered = filtered.filter(a => {
          const date = new Date(a.timestamp)
          return isToday(date)
        })
        break
      case 'week':
        const weekStart = startOfWeek(now, { locale: ko })
        const weekEnd = endOfWeek(now, { locale: ko })
        filtered = filtered.filter(a => {
          const date = new Date(a.timestamp)
          return date >= weekStart && date <= weekEnd
        })
        break
      case 'month':
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        filtered = filtered.filter(a => {
          const date = new Date(a.timestamp)
          return date >= monthStart && date <= monthEnd
        })
        break
    }

    return filtered
  }, [activities, viewMode, statFilter])

  // 날짜별 그룹화
  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: Activity[] } = {}
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp)
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }))
  }, [filteredActivities])

  const getStatEmoji = (statType: string) => {
    const stat = STAT_TYPES.find(s => s.type === statType)
    return stat?.emoji || '🎯'
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return '오늘'
    if (isYesterday(date)) return '어제'
    return format(date, 'M월 d일 (EEE)', { locale: ko })
  }

  const stats = useMemo(() => {
    const totalExp = filteredActivities.reduce((sum, a) => sum + a.experience, 0)
    const avgExp = filteredActivities.length > 0 ? Math.round(totalExp / filteredActivities.length) : 0
    return { totalExp, avgExp, count: filteredActivities.length }
  }, [filteredActivities])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-candy-yellow/20 via-candy-pink/20 to-candy-blue/20 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary mb-4">
            <span>←</span>
            <span>대시보드로 돌아가기</span>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">📚</span>
            활동 히스토리
          </h1>
        </div>

        {/* 필터 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6">
          {/* 기간 필터 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">기간</h3>
            <div className="flex gap-2 flex-wrap">
              {(['today', 'week', 'month', 'all'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode === 'today' && '오늘'}
                  {mode === 'week' && '이번주'}
                  {mode === 'month' && '이번달'}
                  {mode === 'all' && '전체'}
                </button>
              ))}
            </div>
          </div>

          {/* 스탯 필터 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">스탯</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatFilter('all')}
                className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                  statFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                전체
              </button>
              {STAT_TYPES.map(stat => (
                <button
                  key={stat.type}
                  onClick={() => setStatFilter(stat.type)}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all flex items-center gap-2 ${
                    statFilter === stat.type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="text-xl">{stat.emoji}</span>
                  <span>{stat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-3xl block mb-2">📊</span>
              <div className="text-2xl font-bold text-primary">{stats.count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">활동</div>
            </div>
            <div>
              <span className="text-3xl block mb-2">⭐</span>
              <div className="text-2xl font-bold text-primary">{stats.totalExp}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">총 EXP</div>
            </div>
            <div>
              <span className="text-3xl block mb-2">📈</span>
              <div className="text-2xl font-bold text-primary">{stats.avgExp}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">평균 EXP</div>
            </div>
          </div>
        </div>

        {/* 활동 목록 */}
        {groupedActivities.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🤔</span>
            <p className="text-gray-600 dark:text-gray-400">활동 기록이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActivities.map(({ date, activities }, groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  {formatDate(date)}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({activities.length}개 활동)
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getStatEmoji(activity.statType)}</span>
                        <span className="text-2xl">{getActivityEmoji(activity.activityName)}</span>
                        <div>
                          <span className="text-base font-medium text-gray-700 dark:text-gray-300 block">
                            {activity.activityName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(activity.timestamp), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary block">
                          +{activity.experience}
                        </span>
                        <span className="text-xs text-gray-500">EXP</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}