import React, { useEffect, useState, useMemo } from 'react'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { dbHelpers } from '@/lib/database/client'
import type { CalculatedStats } from '@/hooks/useDashboard/types'
import type { Activity } from '@/lib/database/types'

interface StatsOverviewProps {
  stats: CalculatedStats
}

export const StatsOverview = React.memo(function StatsOverview({ stats }: StatsOverviewProps) {
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    let mounted = true
    
    const getTodayActivities = async () => {
      try {
        const activities = await dbHelpers.getActivities(GAME_CONFIG.DEFAULT_USER_ID)
        
        if (!mounted) return
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTime = today.getTime()
        
        const todayActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.timestamp)
          activityDate.setHours(0, 0, 0, 0)
          return activityDate.getTime() === todayTime
        })
        
        setTodayCount(todayActivities.length)
      } catch (error) {
        if (mounted) {
          console.error('[StatsOverview] Failed to get today activities:', error)
        }
      }
    }

    getTodayActivities()
    
    return () => {
      mounted = false
    }
  }, [stats.totalActivities])

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center justify-around">
        <div className="text-center">
          <span className="text-3xl md:text-4xl mb-1 md:mb-2 block animate-bounce">🏆</span>
          <div data-testid="user-level" className="text-xl md:text-2xl font-black text-primary">Lv.{stats.totalLevel}</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">총 레벨</div>
        </div>
        
        <div className="w-px h-12 md:h-16 bg-gray-300 dark:bg-gray-600" />
        
        <div className="text-center">
          <span className="text-3xl md:text-4xl mb-1 md:mb-2 block animate-pulse">📅</span>
          <div className="text-xl md:text-2xl font-black text-primary">{todayCount}</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">오늘 활동</div>
        </div>
        
        <div className="w-px h-12 md:h-16 bg-gray-300 dark:bg-gray-600" />
        
        <div className="text-center">
          <span className="text-3xl md:text-4xl mb-1 md:mb-2 block animate-spin-slow">⭐</span>
          <div className="text-xl md:text-2xl font-black text-primary">{stats.totalExp}</div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">총 EXP</div>
        </div>
      </div>
    </div>
  )
})