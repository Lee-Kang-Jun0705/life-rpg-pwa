'use client'

import { useEffect } from 'react'

export default function DungeonError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dungeon error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">던전에 문제가 발생했습니다</h2>
        <p className="text-purple-300 mb-6">일시적인 오류가 발생했습니다. 다시 시도해주세요.</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}