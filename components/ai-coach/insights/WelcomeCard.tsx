import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import type { TimeTheme, StreakEffect } from '@/lib/ai-coach/types/actions'
import type { ActivityPattern } from '@/lib/ai-coach/types'

interface WelcomeCardProps {
  theme: TimeTheme
  totalLevel: number
  progressPercentage: number
  animateProgress: boolean
  activityPattern: ActivityPattern | null
  streakEffect: StreakEffect
}

export function WelcomeCard({
  theme,
  totalLevel,
  progressPercentage,
  animateProgress,
  activityPattern,
  streakEffect
}: WelcomeCardProps) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
      <div className="absolute -right-8 -top-8 text-8xl opacity-20">
        {theme.emoji}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl animate-bounce">{theme.emoji}</span>
          <h2 className="text-xl font-bold text-gray-800">{theme.message}</h2>
        </div>
        
        {/* 전체 진행률 */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              총 레벨 {totalLevel} → {Math.ceil(totalLevel / 10) * 10}
            </span>
            <span className="text-sm font-bold text-gray-800">
              {Math.round(progressPercentage)}% 달성
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={animateProgress ? progressPercentage : 0} 
              className="h-3 bg-white/50"
              indicatorClassName="bg-gradient-to-r from-candy-blue to-candy-purple transition-all duration-1000"
            />
          </div>
          {progressPercentage > 90 && (
            <div className="text-right">
              <span className="text-xs animate-pulse inline-flex items-center gap-1">
                🎯 레벨업 임박!
              </span>
            </div>
          )}
        </div>

        {/* 연속 일수 배지 */}
        {activityPattern && activityPattern.streakDays > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full">
            <span className="text-2xl">{streakEffect.emoji}</span>
            <span className={`font-bold ${streakEffect.color}`}>
              {streakEffect.title} {activityPattern.streakDays}일 연속!
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}