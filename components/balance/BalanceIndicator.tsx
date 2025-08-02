'use client'

import React from 'react'
import { useBalance } from '@/lib/balance/useBalance'
import { Progress } from '@/components/ui/progress'
import { Activity, Brain, Heart, Trophy, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatType } from '@/lib/types/game-common'

interface BalanceIndicatorProps {
  userId: string
  className?: string
  showDetails?: boolean
  compact?: boolean
}

const STAT_ICONS: Record<StatType, React.ReactNode> = {
  health: <Heart className="w-4 h-4" />,
  learning: <Brain className="w-4 h-4" />,
  relationship: <Activity className="w-4 h-4" />,
  achievement: <Trophy className="w-4 h-4" />
}

const STAT_NAMES: Record<StatType, string> = {
  health: '건강',
  learning: '학습',
  relationship: '관계',
  achievement: '성취'
}

export function BalanceIndicator({
  userId,
  className,
  showDetails = true,
  compact = false
}: BalanceIndicatorProps) {
  const { balanceState, isLoading, error } = useBalance(userId)

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-24 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (error || !balanceState) {
    return null
  }

  const getBalanceColor = (score: number) => {
    if (score >= 90) {
      return 'text-green-600'
    }
    if (score >= 70) {
      return 'text-blue-600'
    }
    if (score >= 50) {
      return 'text-yellow-600'
    }
    if (score >= 30) {
      return 'text-orange-600'
    }
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) {
      return 'bg-green-500'
    }
    if (score >= 70) {
      return 'bg-blue-500'
    }
    if (score >= 50) {
      return 'bg-yellow-500'
    }
    if (score >= 30) {
      return 'bg-orange-500'
    }
    return 'bg-red-500'
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <TrendingUp className={cn('w-4 h-4', getBalanceColor(balanceState.balanceScore))} />
        <span className="text-sm font-medium">
          균형: {balanceState.balanceScore}%
        </span>
        {balanceState.balanceMultiplier !== 1 && (
          <span className="text-xs text-gray-600">
            ({balanceState.balanceMultiplier > 1 ? '+' : ''}{Math.round((balanceState.balanceMultiplier - 1) * 100)}%)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 균형 점수 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">스탯 균형도</h3>
          <span className={cn('text-sm font-bold', getBalanceColor(balanceState.balanceScore))}>
            {balanceState.balanceScore}%
          </span>
        </div>
        <Progress
          value={balanceState.balanceScore}
          className="h-2"
          indicatorClassName={getProgressColor(balanceState.balanceScore)}
        />
      </div>

      {/* 스탯 레벨 비교 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(balanceState.statLevels).map(([stat, level]) => {
          const statType = stat as StatType
          const isHighest = statType === balanceState.highestStat.type
          const isLowest = statType === balanceState.lowestStat.type

          return (
            <div
              key={stat}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border',
                isHighest && 'border-green-300 bg-green-50',
                isLowest && 'border-red-300 bg-red-50',
                !isHighest && !isLowest && 'border-gray-200 bg-gray-50'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full',
                isHighest && 'bg-green-200 text-green-700',
                isLowest && 'bg-red-200 text-red-700',
                !isHighest && !isLowest && 'bg-gray-200 text-gray-700'
              )}>
                {STAT_ICONS[statType]}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">{STAT_NAMES[statType]}</p>
                <p className="text-sm font-bold">Lv.{level}</p>
              </div>
              {isHighest && <span className="text-xs text-green-600">최고</span>}
              {isLowest && <span className="text-xs text-red-600">최저</span>}
            </div>
          )
        })}
      </div>

      {/* 경험치 보너스/페널티 */}
      {balanceState.balanceMultiplier !== 1 && (
        <div className={cn(
          'flex items-center gap-2 p-2 rounded-lg',
          balanceState.balanceMultiplier > 1 ? 'bg-blue-50' : 'bg-orange-50'
        )}>
          <TrendingUp className={cn(
            'w-4 h-4',
            balanceState.balanceMultiplier > 1 ? 'text-blue-600' : 'text-orange-600'
          )} />
          <span className={cn(
            'text-sm font-medium',
            balanceState.balanceMultiplier > 1 ? 'text-blue-800' : 'text-orange-800'
          )}>
            균형 {balanceState.balanceMultiplier > 1 ? '보너스' : '페널티'}:
            {balanceState.balanceMultiplier > 1 ? '+' : ''}{Math.round((balanceState.balanceMultiplier - 1) * 100)}%
          </span>
        </div>
      )}

      {/* 경고 및 추천사항 */}
      {showDetails && (
        <>
          {balanceState.warnings.length > 0 && (
            <div className="space-y-1">
              {balanceState.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {balanceState.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-800 mb-1">추천사항:</p>
              <ul className="space-y-1">
                {balanceState.recommendations.map((rec, index) => (
                  <li key={index} className="text-xs text-blue-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* 레벨 격차 정보 */}
      {showDetails && balanceState.levelGap > 5 && (
        <div className="text-xs text-gray-600 text-center">
          레벨 격차: {balanceState.levelGap}
          (최고 Lv.{balanceState.highestStat.level} - 최저 Lv.{balanceState.lowestStat.level})
        </div>
      )}
    </div>
  )
}
