import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Activity } from '@/lib/database/types'
import { dbHelpers } from '@/lib/database/client'
import { STAT_TYPES, GAME_CONFIG } from '@/lib/types/dashboard'

interface ActivityFeedProps {
  totalActivities: number // To trigger refresh when activities change
}

export const ActivityFeed = React.memo(function ActivityFeed({ totalActivities }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActivities = async() => {
      try {
        setIsLoading(true)
        const allActivities = await dbHelpers.getActivities(GAME_CONFIG.DEFAULT_USER_ID, 10)

        setActivities(allActivities)
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [totalActivities])

  const getStatEmoji = (statType: string) => {
    const stat = STAT_TYPES.find(s => s.type === statType)
    return stat?.emoji || '🎯'
  }

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) {
      return '방금'
    }
    if (minutes < 60) {
      return `${minutes}분 전`
    }
    if (hours < 24) {
      return `${hours}시간 전`
    }
    return `${days}일 전`
  }

  if (isLoading || activities.length === 0) {
    return null
  }

  return (
    <div className="mt-4 mb-20">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-2xl">📋</span>
        <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">최근 활동</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-3 min-w-[120px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{getStatEmoji(activity.statType)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getRelativeTime(activity.timestamp)}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {activity.activityName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                +{activity.experience} EXP
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
})
