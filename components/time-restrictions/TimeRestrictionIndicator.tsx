'use client'

import React from 'react'
import { useTimeRestrictions } from '@/lib/time-restrictions/useTimeRestrictions'
import { Clock, AlertTriangle, TrendingUp, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatType } from '@/lib/types/game-common'

interface TimeRestrictionIndicatorProps {
  userId: string
  statType?: StatType
  className?: string
  showRecommendations?: boolean
}

export function TimeRestrictionIndicator({ 
  userId, 
  statType,
  className,
  showRecommendations = true 
}: TimeRestrictionIndicatorProps) {
  const { timeState, isLoading, findNextGoodTime } = useTimeRestrictions(userId, statType)

  if (isLoading || !timeState) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="w-32 h-4 bg-gray-300 rounded" />
      </div>
    )
  }

  const getTimeIcon = () => {
    if (timeState.isRestricted) return <Ban className="w-4 h-4" />
    if (timeState.isPenalty) return <AlertTriangle className="w-4 h-4" />
    if (timeState.isBonus) return <TrendingUp className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const getTimeColor = () => {
    if (timeState.isRestricted) return 'text-red-600 bg-red-50 border-red-200'
    if (timeState.isPenalty) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (timeState.isBonus) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getMultiplierText = () => {
    if (timeState.isRestricted) return '활동 제한'
    if (timeState.multiplier === 1) return ''
    if (timeState.multiplier > 1) return `+${Math.round((timeState.multiplier - 1) * 100)}% 보너스`
    return `-${Math.round((1 - timeState.multiplier) * 100)}% 페널티`
  }

  const nextGoodTime = findNextGoodTime()
  
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? '오후' : '오전'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${period} ${displayHour}시`
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        getTimeColor()
      )}>
        {getTimeIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{timeState.timeZoneName}</span>
            {getMultiplierText() && (
              <span className="text-xs font-medium">
                {getMultiplierText()}
              </span>
            )}
          </div>
          {timeState.message && (
            <p className="text-xs mt-0.5 opacity-80">
              {timeState.message}
            </p>
          )}
        </div>
      </div>

      {showRecommendations && timeState.recommendedActivities.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-800 mb-1">추천 활동:</p>
          <div className="flex flex-wrap gap-1">
            {timeState.recommendedActivities.map((activity, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {(timeState.isPenalty || timeState.isRestricted) && nextGoodTime && (
        <div className="text-xs text-gray-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            다음 좋은 시간: {formatHour(nextGoodTime.hour)} ({nextGoodTime.name})
            {nextGoodTime.bonus && ' 🌟'}
          </span>
        </div>
      )}
    </div>
  )
}