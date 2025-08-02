'use client'

import { useOffline } from '@/hooks/useOffline'
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const { isOffline, isSlowConnection } = useOffline()
  const [showBanner, setShowBanner] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isOffline) {
      setMessage('오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.')
      setShowBanner(true)
    } else if (isSlowConnection) {
      setMessage('느린 네트워크가 감지되었습니다.')
      setShowBanner(true)
    } else {
      // 온라인 복귀 시 잠시 후 배너 숨기기
      if (showBanner) {
        setMessage('온라인 상태로 전환되었습니다! ✅')
        setTimeout(() => {
          setShowBanner(false)
        }, 3000)
      }
    }
  }, [isOffline, isSlowConnection])

  if (!showBanner) {
    return null
  }

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOffline
          ? 'bg-red-500 text-white'
          : isSlowConnection
            ? 'bg-yellow-500 text-white'
            : 'bg-green-500 text-white'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <span>
          {isOffline ? '📵' : isSlowConnection ? '🐌' : '✅'}
        </span>
        <span>{message}</span>
      </div>
    </div>
  )
}
