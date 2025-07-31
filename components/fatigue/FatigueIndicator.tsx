'use client'

import React from 'react'
import { useFatigue } from '@/lib/fatigue/useFatigue'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Battery, BatteryLow, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FatigueIndicatorProps {
  userId: string
  className?: string
  showDetails?: boolean
}

export function FatigueIndicator({ 
  userId, 
  className,
  showDetails = true 
}: FatigueIndicatorProps) {
  const { fatigueState, isLoading, error } = useFatigue(userId)

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="w-24 h-2 bg-gray-300 rounded" />
      </div>
    )
  }

  if (error || !fatigueState) {
    return null
  }

  const getFatigueColor = (fatigue: number) => {
    if (fatigue < 30) return 'text-green-500'
    if (fatigue < 50) return 'text-yellow-500'
    if (fatigue < 70) return 'text-orange-500'
    if (fatigue < 90) return 'text-red-500'
    return 'text-red-700'
  }

  const getProgressColor = (fatigue: number) => {
    if (fatigue < 30) return 'bg-green-500'
    if (fatigue < 50) return 'bg-yellow-500'
    if (fatigue < 70) return 'bg-orange-500'
    if (fatigue < 90) return 'bg-red-500'
    return 'bg-red-700'
  }

  const FatigueIcon = fatigueState.currentFatigue >= 70 ? BatteryLow : Battery

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FatigueIcon className={cn("w-4 h-4", getFatigueColor(fatigueState.currentFatigue))} />
          <span className="text-sm font-medium">
            피로도: {Math.round(fatigueState.currentFatigue)}%
          </span>
        </div>
        {fatigueState.experienceEfficiency < 1 && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <Zap className="w-3 h-3" />
            <span>경험치 {Math.round(fatigueState.experienceEfficiency * 100)}%</span>
          </div>
        )}
      </div>

      <Progress 
        value={fatigueState.currentFatigue} 
        className="h-2"
        indicatorClassName={getProgressColor(fatigueState.currentFatigue)}
      />

      {showDetails && fatigueState.warnings.length > 0 && (
        <div className="space-y-1 mt-2">
          {fatigueState.warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {showDetails && fatigueState.isExhausted && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-2">
          <p className="text-xs text-red-800 font-medium">
            탈진 상태! 휴식이 필요합니다.
          </p>
        </div>
      )}

      {showDetails && fatigueState.activityStreak >= 5 && (
        <div className="text-xs text-gray-600 mt-1">
          연속 활동: {fatigueState.activityStreak}회
        </div>
      )}
    </div>
  )
}