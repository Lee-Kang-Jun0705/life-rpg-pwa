'use client'

import { cn } from '@/lib/utils'

interface VoiceInputErrorProps {
  error: Error | null
  showFallback: boolean
  position: 'bottom-right' | 'bottom-center' | 'bottom-left'
  onReset: () => void
  onShowFallback: () => void
}

export function VoiceInputError({
  error,
  showFallback,
  position,
  onReset,
  onShowFallback
}: VoiceInputErrorProps) {
  if (!error || showFallback) {
    return null
  }

  const positionClass = position === 'bottom-center'
    ? 'bottom-28 left-1/2 -translate-x-1/2'
    : position === 'bottom-right'
      ? 'bottom-28 right-6'
      : 'bottom-28 left-6'

  return (
    <div className={cn(
      'fixed z-40 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-lg p-4',
      'max-w-sm w-full mx-4 transition-all duration-300',
      'border border-red-200 dark:border-red-800',
      positionClass
    )}>
      <div className="flex items-start gap-2">
        <span className="text-red-500">⚠️</span>
        <div className="flex-1">
          <div className="font-medium text-red-800 dark:text-red-200">
            오류 발생
          </div>
          <div className="text-sm text-red-600 dark:text-red-300 mt-1">
            {error.message}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onReset}
              className="text-sm px-3 py-1 bg-red-100 dark:bg-red-800
                       text-red-700 dark:text-red-200 rounded
                       hover:bg-red-200 dark:hover:bg-red-700
                       transition-colors"
            >
              다시 시도
            </button>

            <button
              onClick={onShowFallback}
              className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700
                       text-gray-700 dark:text-gray-200 rounded
                       hover:bg-gray-200 dark:hover:bg-gray-600
                       transition-colors"
            >
              직접 입력
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
