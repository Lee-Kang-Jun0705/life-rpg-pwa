'use client'

import { ReactNode } from 'react'
import { useGameInit } from '@/hooks/useGameInit'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'

interface GameLayoutProps {
  children: ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  const { isLoading, isLoaded, hasError, error, lastSaveTime } = useGameInit()

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">게임 데이터 불러오는 중...</h2>
          <p className="text-gray-400">잠시만 기다려주세요</p>
        </motion.div>
      </div>
    )
  }

  // 에러 발생
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <motion.div
          initial={{ opacity: 0, _y: 20 }}
          animate={{ opacity: 1, _y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">데이터 로드 실패</h2>
          <p className="text-gray-400 mb-4">
            게임 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <details className="text-left bg-gray-800 rounded-lg p-4 mb-4">
            <summary className="cursor-pointer text-gray-300">오류 상세정보</summary>
            <pre className="mt-2 text-xs text-red-400 overflow-x-auto">
              {error?.message || '알 수 없는 오류'}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            새로고침
          </button>
        </motion.div>
      </div>
    )
  }

  // 정상 로드 완료
  if (isLoaded) {
    return (
      <>
        {children}
        {lastSaveTime && (
          <div className="fixed top-20 right-4 text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full opacity-50">
            마지막 저장: {new Date(lastSaveTime).toLocaleTimeString('ko-KR')}
          </div>
        )}
      </>
    )
  }

  return null
}
