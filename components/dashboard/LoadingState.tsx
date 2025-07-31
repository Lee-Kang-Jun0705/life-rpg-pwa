import React from 'react'

export const LoadingState = React.memo(function LoadingState() {
  React.useEffect(() => {
    console.log('🔄 LoadingState component rendered')
    // 10초 후에도 로딩 중이면 경고
    const timer = setTimeout(() => {
      console.warn('⚠️ Loading is taking too long (>10s)')
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg font-semibold">⚔️ 모험 준비 중... ⚔️</p>
        <p className="text-sm text-gray-600 mt-2">데이터를 불러오고 있습니다...</p>
      </div>
    </div>
  )
})