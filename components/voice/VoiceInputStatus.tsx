'use client'

import { cn } from '@/lib/utils'

interface VoiceInputStatusProps {
  isListening: boolean
  status: string
  transcript: string
  confidence: number
  position: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

export function VoiceInputStatus({
  isListening,
  status,
  transcript,
  confidence,
  position
}: VoiceInputStatusProps) {
  if (!isListening || !transcript) {
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
        {status === 'listening' && (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="animate-pulse">👂</span>
            <span>듣고 있어요...</span>
          </div>
        )}

        {status === 'processing' && transcript && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span>🎤</span>
              <span>인식 중...</span>
            </div>

            <div className="text-gray-900 dark:text-gray-100">
              {transcript}
            </div>

            {confidence > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                신뢰도: {(confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
