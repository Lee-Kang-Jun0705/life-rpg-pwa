'use client'

import React, { useEffect, useState } from 'react'
import { errorManager, ErrorNotification } from '@/lib/error/error-manager'
import { cn } from '@/lib/utils'

export function ErrorNotifications() {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([])

  useEffect(() => {
    // 에러 리스너 등록
    const unsubscribe = errorManager.addErrorListener((notification) => {
      setNotifications(prev => [...prev, notification])

      // 지정된 시간 후 자동 제거
      if (notification.duration) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id))
        }, notification.duration)
      }
    })

    return unsubscribe
  }, [])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2 max-w-sm" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "animate-in slide-in-from-right p-4 rounded-lg shadow-lg flex items-start gap-3",
            {
              'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300': notification.type === 'error',
              'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300': notification.type === 'warning',
              'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300': notification.type === 'info'
            }
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}