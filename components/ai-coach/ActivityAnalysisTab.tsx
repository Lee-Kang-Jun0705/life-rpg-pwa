'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { Activity } from '@/lib/database/types'
import { dbHelpers } from '@/lib/database/client'
import { STAT_TYPES, GAME_CONFIG } from '@/lib/types/dashboard'
import type { Stat } from '@/lib/types/dashboard'
import { motion } from 'framer-motion'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card } from '@/components/ui/Card'

interface ActivityAnalysisTabProps {
  userStats: Stat[]
}

type ViewPeriod = 'week' | 'month'

export function ActivityAnalysisTab({ userStats }: ActivityAnalysisTabProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    const loadActivities = async() => {
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

  // 기간별 활동 데이터 계산
  const periodData = useMemo(() => {
    const now = new Date()
    const start = viewPeriod === 'week'
      ? startOfWeek(now, { locale: ko })
      : startOfMonth(now)
    const end = viewPeriod === 'week'
      ? endOfWeek(now, { locale: ko })
      : endOfMonth(now)

    const days = eachDayOfInterval({ start, end })

    return days.map(day => {
      const dayActivities = activities.filter(a =>
        isSameDay(new Date(a.timestamp), day)
      )

      const statCounts: Record<string, number> = {}
      STAT_TYPES.forEach(stat => {
        statCounts[stat.type] = dayActivities.filter(a => a.statType === stat.type).length
      })

      return {
        date: day,
        total: dayActivities.length,
        exp: dayActivities.reduce((sum, a) => sum + a.experience, 0),
        statCounts,
        activities: dayActivities
      }
    })
  }, [activities, viewPeriod])

  // 활동 패턴 분석
  const patterns = useMemo(() => {
    // 시간대별 활동
    const hourCounts = new Array(24).fill(0)
    activities.forEach(a => {
      const hour = new Date(a.timestamp).getHours()
      hourCounts[hour]++
    })

    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))
    const mostActiveTime =
      mostActiveHour < 6 ? '새벽' :
        mostActiveHour < 12 ? '오전' :
          mostActiveHour < 18 ? '오후' : '저녁'

    // 스탯별 분포
    const statDistribution = STAT_TYPES.map(stat => ({
      type: stat.type,
      name: stat.name,
      emoji: stat.emoji,
      count: activities.filter(a => a.statType === stat.type).length,
      percentage: activities.length > 0
        ? Math.round((activities.filter(a => a.statType === stat.type).length / activities.length) * 100)
        : 0
    }))

    // 가장 많이 한 활동
    const activityCounts: Record<string, number> = {}
    activities.forEach(a => {
      activityCounts[a.activityName] = (activityCounts[a.activityName] || 0) + 1
    })
    const topActivities = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return {
      mostActiveTime,
      mostActiveHour,
      statDistribution,
      topActivities
    }
  }, [activities])

  // 선택된 날짜의 활동
  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) {
      return []
    }
    return activities.filter(a => isSameDay(new Date(a.timestamp), selectedDate))
  }, [activities, selectedDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-candy-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">활동 데이터 분석 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setViewPeriod('week')}
          className={`px-4 py-2 rounded-2xl font-medium transition-all ${
            viewPeriod === 'week'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          주간
        </button>
        <button
          onClick={() => setViewPeriod('month')}
          className={`px-4 py-2 rounded-2xl font-medium transition-all ${
            viewPeriod === 'month'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          월간
        </button>
      </div>

      {/* 활동 캘린더 히트맵 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📅</span>
          활동 캘린더
        </h3>

        <div className={`grid ${viewPeriod === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-2`}>
          {periodData.map(({ date, total, exp }) => {
            const isToday = isSameDay(date, new Date())
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const intensity = Math.min(100, (total / 10) * 100)

            return (
              <motion.button
                key={date.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(date)}
                className={`relative p-3 rounded-xl transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary'
                    : ''
                } ${
                  isToday
                    ? 'ring-2 ring-candy-blue'
                    : ''
                }`}
                style={{
                  backgroundColor: total > 0
                    ? `rgba(59, 130, 246, ${intensity / 100})`
                    : 'rgba(156, 163, 175, 0.1)'
                }}
              >
                <div className="text-xs font-medium mb-1">
                  {format(date, 'd')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {format(date, 'EEE', { locale: ko })}
                </div>
                {total > 0 && (
                  <div className="text-xs font-bold mt-1">
                    {total}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* 선택된 날짜의 활동 */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl"
          >
            <h4 className="font-semibold mb-3">
              {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })} 활동
            </h4>
            {selectedDateActivities.length === 0 ? (
              <p className="text-sm text-gray-500">활동 기록이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {selectedDateActivities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{STAT_TYPES.find(s => s.type === activity.statType)?.emoji}</span>
                      <span>{activity.activityName}</span>
                    </div>
                    <span className="font-medium">+{activity.experience}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </Card>

      {/* 활동 패턴 분석 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          활동 패턴 분석
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 가장 활발한 시간 */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>⏰</span> 가장 활발한 시간
            </h4>
            <p className="text-2xl font-bold text-primary">{patterns.mostActiveTime}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {patterns.mostActiveHour}시 경에 가장 많이 활동해요
            </p>
          </div>

          {/* 균형 지수 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>⚖️</span> 스탯 균형도
            </h4>
            <div className="space-y-2">
              {patterns.statDistribution.map(stat => (
                <div key={stat.type} className="flex items-center gap-2">
                  <span className="text-lg">{stat.emoji}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{stat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* TOP 활동 */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          자주 하는 활동 TOP 5
        </h3>

        <div className="space-y-3">
          {patterns.topActivities.map(([activity, count], index) => (
            <motion.div
              key={activity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                <span className="text-base font-medium">{activity}</span>
              </div>
              <span className="text-lg font-bold text-primary">{count}회</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
