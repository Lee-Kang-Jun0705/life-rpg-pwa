'use client'

import React, { useEffect } from 'react'
import { visibilityManager } from '@/lib/utils/visibility-manager'
import { FeatureFlagsProvider } from '@/lib/feature-flags'
import { FeatureFlagPanel } from '@/components/debug/FeatureFlagPanel'

// 통합 시스템 Provider
interface SystemProvidersProps {
  children: React.ReactNode
}

export function SystemProviders({ children }: SystemProvidersProps) {

  // Service Worker 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox

      const promptNewVersionAvailable = (_event: WorkboxEvent) => {
        if (confirm('새로운 버전이 있습니다. 업데이트하시겠습니까?')) {
          wb.addEventListener('controlling', () => {
            window.location.reload()
          })

          wb.messageSkipWaiting()
        }
      }

      wb.addEventListener('waiting', promptNewVersionAvailable)
      wb.register()
    }
  }, [])

  // Visibility Manager 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.visibilityManager = visibilityManager
    }
    console.log('[SystemProviders] Visibility Manager initialized')
  }, [])

  return (
    <FeatureFlagsProvider>
      {children}
      {/* 개발 환경에서 Feature Flag 패널 표시 */}
      <FeatureFlagPanel />
    </FeatureFlagsProvider>
  )
}