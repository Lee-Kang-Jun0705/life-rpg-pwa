'use client'

import { cn } from '@/lib/utils'

interface VoiceInputResultProps {
  isListening: boolean
  activity: {
    description?: string
    type?: string | null
  }
  position: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

const activityTypeStyles = {
  health: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  learning: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  relationship: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  achievement: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
}

const activityTypeLabels = {
  health: '🏃 건강',
  learning: '📚 학습',
  relationship: '🤝 관계',
  achievement: '🏆 성취'
}

export function VoiceInputResult({
  isListening,
  activity,
  position
}: VoiceInputResultProps) {
  if (isListening || !activity.description) {
    return null
  }

  const positionClass = position === 'bottom-center'
    ? 'bottom-28 left-1/2 -translate-x-1/2'
    : position === 'bottom-right'
      ? 'bottom-28 right-6'
      : 'bottom-28 left-6'

  return (
    <div className={cn(
      'fixed z-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4',
      'max-w-sm w-full mx-4 transition-all duration-300',
      positionClass
    )}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <span>✅</span>
          <span className="font-medium">인식 완료</span>
        </div>

        <div className="text-gray-700 dark:text-gray-300">
          {activity.description}
        </div>

        {activity.type && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              활동 유형:
            </span>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              activityTypeStyles[activity.type as keyof typeof activityTypeStyles]
            )}>
              {activityTypeLabels[activity.type as keyof typeof activityTypeLabels]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
