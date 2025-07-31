'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div role="alert" className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            오류가 발생했습니다
          </h1>
          
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {error.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              이 문제가 계속되면 다음을 시도해보세요:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>페이지를 새로고침하세요</li>
              <li>브라우저 캐시를 삭제하세요</li>
              <li>다른 브라우저에서 시도해보세요</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={resetError}
              variant="default"
              className="flex-1"
            >
              다시 시도
            </Button>
            <Button
              onClick={() => {
                // 로컬 스토리지 정리 (선택사항)
                if (confirm('앱 데이터를 초기화하시겠습니까?')) {
                  localStorage.clear()
                  window.location.href = '/'
                }
              }}
              variant="secondary"
              className="flex-1"
            >
              초기화
            </Button>
          </div>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              개발자용 오류 정보
            </summary>
            <div className="mt-3">
              <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                {error.name}: {error.message}
              </p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
                {error.stack}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}