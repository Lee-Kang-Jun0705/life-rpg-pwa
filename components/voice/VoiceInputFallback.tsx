'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface VoiceInputFallbackProps {
  show: boolean
  position: 'bottom-right' | 'bottom-center' | 'bottom-left'
  onSubmit: (_input: string) => void
  onClose: () => void
}

export function VoiceInputFallback({
  show,
  position,
  onSubmit,
  onClose
}: VoiceInputFallbackProps) {
  const [input, setInput] = useState('')

  if (!show) {
    return null
  }

  const positionClass = position === 'bottom-center'
    ? 'bottom-28 left-1/2 -translate-x-1/2'
    : position === 'bottom-right'
      ? 'bottom-28 right-6'
      : 'bottom-28 left-6'

  const handleSubmit = (_e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input.trim())
      setInput('')
    }
  }

  return (
    <div className={cn(
      'fixed z-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4',
      'max-w-sm w-full mx-4 transition-all duration-300',
      positionClass
    )}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            활동 직접 입력
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 30분 운동했어요"
          className="w-full px-3 py-2 border rounded-lg resize-none
                   bg-white dark:bg-gray-700
                   border-gray-300 dark:border-gray-600
                   text-gray-900 dark:text-gray-100
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg
                     hover:bg-indigo-700 disabled:bg-gray-300
                     dark:disabled:bg-gray-700 transition-colors"
          >
            활동 기록
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700
                     text-gray-700 dark:text-gray-200 rounded-lg
                     hover:bg-gray-200 dark:hover:bg-gray-600
                     transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
